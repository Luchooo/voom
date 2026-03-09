"use client";

import { useCallback, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import {
  combineScreenAndCameraStreams,
  mergeAudioIntoStream,
  mixAudioStreams,
  stopAllTracks,
} from "@voom/lib/streams";
import { getRecordingFilename, downloadBlob } from "@voom/lib/download";
import { getSupportedMimeType } from "@voom/lib/mediaRecorder";
import type {
  CameraOverlayState,
  RecorderOptions,
  RecordingResult,
  RecorderStatus,
  RecordingResolution,
} from "@voom/types/recorder";
import { CIRCLE_DIAMETER_DEFAULT } from "@voom/types/recorder";
import { useScreenCapture } from "./useScreenCapture";
import { useMicrophone } from "./useMicrophone";
import { useCamera } from "./useCamera";

function getVideoBitrate(
  resolution: RecordingResolution,
  frameRate: number,
  performanceMode: boolean
): number {
  const base = resolution === "720p" ? 1.5 : resolution === "1080p" ? 2.5 : 2.5;
  const fpsFactor = frameRate <= 30 ? 1 : frameRate <= 60 ? 1.5 : 2;
  const mult = performanceMode ? 0.7 : 1;
  return Math.round(base * fpsFactor * mult * 1_000_000);
}

/**
 * Hook principal que orquesta pantalla, micrófono, cámara y MediaRecorder.
 * Mantiene el estado de la grabación y expone start/stop/download.
 * @param overlayRef Ref al estado del overlay de cámara (posición/tamaño); opcional.
 */
export function useRecorder(
  options: RecorderOptions,
  overlayRef?: MutableRefObject<CameraOverlayState | null>
) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [recordingResult, setRecordingResult] = useState<RecordingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const screen = useScreenCapture();
  const mic = useMicrophone();
  const camera = useCamera(
    options.camera,
    options.performanceMode ?? false,
    options.videoDeviceId,
    options.circleDiameterPx ?? CIRCLE_DIAMETER_DEFAULT
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const mixedAudioCloseRef = useRef<(() => void) | null>(null);

  const stopAllStreams = useCallback(() => {
    screen.stopCapture();
    mic.stop();
    if (!options.camera) camera.stop();
  }, [screen, mic, camera, options.camera]);

  const startRecording = useCallback(
    async (opts?: {
      useExistingScreenStream?: boolean;
      overlayState?: CameraOverlayState | null;
    }) => {
      setError(null);
      setRecordingResult(null);
      setStatus("requesting");
      chunksRef.current = [];

      const mustCaptureScreen = options.screen;
      if (!mustCaptureScreen) {
        setError("Debes activar al menos la captura de pantalla.");
        setStatus("idle");
        return;
      }

      let screenStream: MediaStream | null;
      if (opts?.useExistingScreenStream && screen.streamRef.current) {
        screenStream = screen.streamRef.current;
      } else {
        screenStream = await screen.startCapture(options.resolution);
      }
      if (!screenStream) {
        setError(screen.error ?? "No se pudo capturar la pantalla.");
        setStatus("idle");
        return;
      }

    let micStream: MediaStream | null = null;
    if (options.microphone) {
      micStream = await mic.start(options.audioDeviceId);
    }

    const streamsWithAudio: MediaStream[] = [];
    if (screenStream.getAudioTracks().length > 0) {
      streamsWithAudio.push(screenStream);
    }
    if (micStream) {
      streamsWithAudio.push(micStream);
    }

    const { stream: mixedAudioStream, close: mixedAudioClose, ready: mixedAudioReady } =
      mixAudioStreams(streamsWithAudio);
    mixedAudioCloseRef.current = mixedAudioClose;

    const overlaySnapshot = opts?.overlayState;
    const isAvatar =
      (overlaySnapshot?.isAvatar ?? overlayRef?.current?.isAvatar) === true;
    const cameraStream =
      options.camera && !isAvatar ? camera.stream : null;
    const effectiveFps =
      options.performanceMode ? Math.min(options.frameRate, 30) : options.frameRate;
    const videoStream = combineScreenAndCameraStreams(screenStream, cameraStream, {
      fps: effectiveFps,
      overlayRef: overlayRef ?? undefined,
      overlayState: overlaySnapshot ?? undefined,
      flipCamera: options.flipCamera !== false,
    });
    const finalStream = mergeAudioIntoStream(
      videoStream,
      mixedAudioStream.getAudioTracks().length > 0 ? mixedAudioStream : null
    );

    await mixedAudioReady;
    await new Promise((r) => setTimeout(r, 250));

    const performanceMode = options.performanceMode ?? false;
    const mimeType = getSupportedMimeType(performanceMode);
    const videoBitrate = getVideoBitrate(
      options.resolution,
      options.frameRate,
      performanceMode
    );
    const recorder = new MediaRecorder(finalStream, {
      mimeType,
      videoBitsPerSecond: videoBitrate,
      audioBitsPerSecond: performanceMode ? 96000 : 128000,
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const closeMixed = mixedAudioCloseRef.current;
      mixedAudioCloseRef.current = null;
      setTimeout(() => closeMixed?.(), 150);
      stopAllTracks(finalStream);
      stopAllTracks(screenStream);
      if (micStream) stopAllTracks(micStream);
      const durationSeconds = (Date.now() - startTimeRef.current) / 1000;
      const blob = new Blob(chunksRef.current, { type: mimeType.split(";")[0] });
      const url = URL.createObjectURL(blob);
      setRecordingResult({ blob, url, durationSeconds });
      setStatus("ready");
    };

    recorder.onerror = () => {
      setError("Error durante la grabación.");
      setStatus("idle");
    };

    mediaRecorderRef.current = recorder;
    startTimeRef.current = Date.now();
    recorder.start(performanceMode ? 2000 : 1000);
    setStatus("recording");
  },
  [options, screen, mic, camera]
  );

  const stopRecording = useCallback(() => {
    setStatus("stopping");
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    stopAllStreams();
    mediaRecorderRef.current = null;
  }, [stopAllStreams]);

  const downloadRecording = useCallback(() => {
    const result = recordingResult;
    if (!result) return;
    const filename = getRecordingFilename("webm");
    downloadBlob(result.blob, filename);
  }, [recordingResult]);

  const reset = useCallback(() => {
    if (recordingResult?.url) URL.revokeObjectURL(recordingResult.url);
    setRecordingResult(null);
    setStatus("idle");
    setError(null);
  }, [recordingResult]);

  return {
    status,
    error: error ?? screen.error ?? mic.error ?? camera.error,
    recordingResult,
    startRecording,
    stopRecording,
    downloadRecording,
    reset,
    screen,
    mic,
    camera,
  };
}
