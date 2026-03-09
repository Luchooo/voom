"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import {
  combineScreenAndCameraStreams,
  mergeAudioIntoStream,
  mixAudioStreams,
  stopAllTracks,
} from "@voom/lib/streams";
import { getRecordingFilename, downloadBlob } from "@voom/lib/download";
import { getSupportedMimeType } from "@voom/lib/mediaRecorder";
import { convertWebmToMp4 } from "@voom/lib/convertWebmToMp4";
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
  /** Lista de versiones: [original, edición 1, edición 2, ...]. El usuario puede volver a cualquiera. */
  const [versions, setVersions] = useState<RecordingResult[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isConvertingToMp4, setIsConvertingToMp4] = useState(false);

  const recordingResult = versions.length > 0 ? versions[currentVersionIndex] ?? versions[0] : null;

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
  const stopRecordingRef = useRef<() => void>(() => {});
  /** Referencia al stream de getDisplayMedia para detenerlo en cuanto el usuario pulse Detener y que el navegador oculte "Dejar de compartir". */
  const screenStreamRef = useRef<MediaStream | null>(null);

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
      setVersions([]);
      setCurrentVersionIndex(0);
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
        screenStream = await screen.startCapture(options.resolution, () => stopRecordingRef.current());
      }
      if (!screenStream) {
        setError(screen.error ?? "No se pudo capturar la pantalla.");
        setStatus("idle");
        return;
      }
      screenStreamRef.current = screenStream;

      // Cuando el usuario pulsa "Dejar de compartir" en la barra del navegador, la pista termina.
      // El stream puede haberse obtenido en RecordingFlow (sin callback), por eso registramos aquí siempre.
      const screenVideoTrack = screenStream.getVideoTracks()[0];
      if (screenVideoTrack) {
        screenVideoTrack.addEventListener("ended", () => {
          console.log("[Voom] Usuario pulsó «Dejar de compartir» en la barra del navegador.");
          stopRecordingRef.current();
        });
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
      // Asegurar que el stream de pantalla quede liberado por si no se detuvo en stopRecording
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      const durationSeconds = (Date.now() - startTimeRef.current) / 1000;
      const blob = new Blob(chunksRef.current, { type: mimeType.split(";")[0] });
      const url = URL.createObjectURL(blob);
      setVersions([{ blob, url, durationSeconds }]);
      setCurrentVersionIndex(0);
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
  [options, screen, mic, camera, overlayRef]
  );

  const stopRecording = useCallback(() => {
    setStatus("stopping");
    // Detener de inmediato todas las pistas del stream de pantalla para que el navegador oculte "Dejar de compartir / Ocultar"
    const screenStream = screenStreamRef.current;
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    stopAllStreams();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    mediaRecorderRef.current = null;
  }, [stopAllStreams]);

  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  const downloadRecording = useCallback(async (format: "webm" | "mp4" = "webm") => {
    const result = recordingResult;
    if (!result) return;
    if (format === "mp4") {
      setIsConvertingToMp4(true);
      try {
        const mp4Blob = await convertWebmToMp4(result.blob);
        const filename = getRecordingFilename("mp4");
        downloadBlob(mp4Blob, filename);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al convertir a MP4");
      } finally {
        setIsConvertingToMp4(false);
      }
    } else {
      const filename = getRecordingFilename("webm");
      downloadBlob(result.blob, filename);
    }
  }, [recordingResult]);

  const reset = useCallback(() => {
    setVersions((prev) => {
      prev.forEach((v) => URL.revokeObjectURL(v.url));
      return [];
    });
    setCurrentVersionIndex(0);
    setStatus("idle");
    setError(null);
  }, []);

  /** Añade una nueva versión (recorte) a la lista y la selecciona. No se pierde el original. */
  const addTrimmedVersion = useCallback((blob: Blob, durationSeconds: number) => {
    const url = URL.createObjectURL(blob);
    setVersions((prev) => [...prev, { blob, url, durationSeconds }]);
    setCurrentVersionIndex((prev) => prev + 1);
  }, []);

  return {
    status,
    error: error ?? screen.error ?? mic.error ?? camera.error,
    recordingResult,
    versions,
    currentVersionIndex,
    setCurrentVersion: setCurrentVersionIndex,
    startRecording,
    stopRecording,
    downloadRecording,
    isConvertingToMp4,
    reset,
    addTrimmedVersion,
    screen,
    mic,
    camera,
  };
}
