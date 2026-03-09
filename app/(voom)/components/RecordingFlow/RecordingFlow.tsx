"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type RecordingFlowState,
  type RecorderOptions,
  type CameraOverlaySize,
  CIRCLE_DIAMETER_MIN,
  CIRCLE_DIAMETER_MAX,
  CIRCLE_DIAMETER_DEFAULT,
  AVATAR_CIRCLE_DIAMETER,
} from "@voom/types/recorder";
import { useRecorder } from "@voom/hooks/useRecorder";
import type { CameraOverlayState } from "@voom/types/recorder";
import {
  loadRecorderOptions,
  saveRecorderOptions,
  loadCameraOverlay,
  saveCameraOverlay,
  clearRecorderStorage,
  type StoredCameraOverlay,
} from "@voom/lib/recorderStorage";
import {
  RecordingOverlay,
  WelcomeStep,
  CircularCameraPreview,
  DeviceSetupCard,
  CountdownStep,
} from "./steps";

const DEFAULT_OPTIONS: RecorderOptions = {
  screen: true,
  microphone: true,
  camera: true,
  resolution: "1080p",
  frameRate: 30,
  performanceMode: true,
  flipCamera: true,
  circleDiameterPx: CIRCLE_DIAMETER_DEFAULT,
};

const DEFAULT_CAMERA: StoredCameraOverlay = {
  position: { x: 32, y: 320 },
  size: "small",
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getInitialOptions(): RecorderOptions {
  if (typeof window === "undefined") return DEFAULT_OPTIONS;
  const loaded = loadRecorderOptions() ?? DEFAULT_OPTIONS;
  return {
    ...DEFAULT_OPTIONS,
    ...loaded,
    flipCamera: loaded.flipCamera ?? DEFAULT_OPTIONS.flipCamera,
    circleDiameterPx: clamp(
      loaded.circleDiameterPx ?? CIRCLE_DIAMETER_DEFAULT,
      CIRCLE_DIAMETER_MIN,
      CIRCLE_DIAMETER_MAX,
    ),
  };
}

function getInitialCamera(): StoredCameraOverlay {
  if (typeof window === "undefined") return DEFAULT_CAMERA;
  return loadCameraOverlay() ?? DEFAULT_CAMERA;
}

/**
 * Flujo de pre-grabación: welcome → device_setup → (screen selection) → countdown → recording → ready.
 * Opciones y posición de cámara se persisten en localStorage.
 */
export function RecordingFlow() {
  const [flowState, setFlowState] = useState<RecordingFlowState>("welcome");
  const [options, setOptions] = useState<RecorderOptions>(getInitialOptions);
  const [cameraState, setCameraState] =
    useState<StoredCameraOverlay>(getInitialCamera);
  const [storageKey, setStorageKey] = useState(0);
  const overlayRef = useRef<CameraOverlayState | null>(null);

  useEffect(() => {
    saveRecorderOptions(options);
  }, [options]);

  const handleCameraStateChange = useCallback(
    (position: { x: number; y: number }, size: CameraOverlaySize) => {
      setCameraState({ position, size });
      saveCameraOverlay({ position, size });
    },
    [],
  );

  const handleCircleDiameterChange = useCallback((diameterPx: number) => {
    setOptions((prev) => ({
      ...prev,
      circleDiameterPx: clamp(
        diameterPx,
        CIRCLE_DIAMETER_MIN,
        CIRCLE_DIAMETER_MAX,
      ),
    }));
  }, []);

  const handleClearSettings = useCallback(() => {
    clearRecorderStorage();
    setOptions(DEFAULT_OPTIONS);
    setCameraState(DEFAULT_CAMERA);
    setStorageKey((k) => k + 1);
  }, []);

  const {
    error,
    recordingResult,
    startRecording,
    stopRecording,
    downloadRecording,
    reset,
    camera,
    screen,
  } = useRecorder(options, overlayRef);

  const handleStartSetup = useCallback(() => {
    setFlowState("device_setup");
  }, []);

  const handleStartRecordingClick = useCallback(async () => {
    setFlowState("awaiting_screen_selection");
    const stream = await screen.startCapture(options.resolution);
    if (!stream) {
      setFlowState("device_setup");
      return;
    }
    setFlowState("countdown");
  }, [screen, options.resolution]);

  const handleCountdownComplete = useCallback(() => {
    const winW = typeof window !== "undefined" ? window.innerWidth : 1920;
    const winH = typeof window !== "undefined" ? window.innerHeight : 1080;
    const overlayState: CameraOverlayState = {
      xRatio:
        winW > 0 ? Math.max(0, Math.min(1, cameraState.position.x / winW)) : 0,
      yRatio:
        winH > 0 ? Math.max(0, Math.min(1, cameraState.position.y / winH)) : 0,
      circleDiameterPx:
        cameraState.size === "fullscreen"
          ? undefined
          : cameraState.size === "avatar"
            ? AVATAR_CIRCLE_DIAMETER
            : (options.circleDiameterPx ?? CIRCLE_DIAMETER_DEFAULT),
      isFullScreen: cameraState.size === "fullscreen",
      isAvatar: cameraState.size === "avatar",
    };
    startRecording({ useExistingScreenStream: true, overlayState });
    setFlowState("recording");
  }, [startRecording, cameraState, options.circleDiameterPx]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    setFlowState("ready");
  }, [stopRecording]);

  const handleReset = useCallback(() => {
    reset();
    setFlowState("welcome");
  }, [reset]);

  if (flowState === "recording" || flowState === "ready") {
    return (
      <RecordingOverlay>
        {flowState === "recording" && (
          <div className="flex min-h-full flex-col items-center justify-center gap-6 p-8">
            <div className="rounded-full bg-red-500/20 px-4 py-2 text-sm font-medium text-red-200">
              Grabando…
            </div>
            <button
              type="button"
              onClick={handleStopRecording}
              className="rounded-lg bg-red-600 px-6 py-2.5 font-semibold text-white hover:bg-red-500"
            >
              Detener
            </button>
          </div>
        )}
        {flowState === "ready" && recordingResult && (
          <div className="flex min-h-full flex-col items-center justify-center gap-6 p-6">
            <p className="text-sm text-white/80">
              Grabación lista ({recordingResult.durationSeconds.toFixed(1)} s)
            </p>
            <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-white/20 bg-black/50 shadow-2xl">
              <video
                src={recordingResult.url}
                controls
                playsInline
                className="h-auto w-full"
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={downloadRecording}
                className="rounded-lg bg-orange-600 px-6 py-2.5 font-semibold text-white hover:bg-orange-500"
              >
                Descargar
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border-2 border-white/40 bg-white/15 px-6 py-2.5 font-semibold text-white hover:bg-white/25"
              >
                Grabar de nuevo
              </button>
            </div>
          </div>
        )}
      </RecordingOverlay>
    );
  }

  return (
    <RecordingOverlay>
      {flowState === "welcome" && <WelcomeStep onStart={handleStartSetup} />}

      {flowState === "device_setup" && (
        <>
          <DeviceSetupCard
            options={options}
            onOptionsChange={setOptions}
            onStartRecording={handleStartRecordingClick}
            onClearSettings={handleClearSettings}
            isRequestingScreen={false}
          />
          {options.camera && (
            <CircularCameraPreview
              key={storageKey}
              stream={camera.stream}
              overlayRef={overlayRef}
              initialPosition={cameraState.position}
              initialSize={cameraState.size}
              circleDiameterPx={
                options.circleDiameterPx ?? CIRCLE_DIAMETER_DEFAULT
              }
              flipCamera={options.flipCamera !== false}
              onStateChange={handleCameraStateChange}
              onCircleDiameterChange={handleCircleDiameterChange}
            />
          )}
        </>
      )}

      {flowState === "awaiting_screen_selection" && (
        <>
          <DeviceSetupCard
            options={options}
            onOptionsChange={setOptions}
            onStartRecording={() => {}}
            onClearSettings={handleClearSettings}
            isRequestingScreen
          />
          <div className="flex min-h-full items-center justify-center p-8">
            <p className="text-white/90">
              Selecciona qué compartir en el diálogo del navegador…
            </p>
          </div>
        </>
      )}

      {flowState === "countdown" && (
        <CountdownStep onComplete={handleCountdownComplete} seconds={3} />
      )}

      {error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-lg border border-red-500/50 bg-red-500/20 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      )}
    </RecordingOverlay>
  );
}
