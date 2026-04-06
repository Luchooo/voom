"use client";

import { useAuth } from "@/hooks/useAuth";
import { useCallback, useRef, useState } from "react";
import type { CameraOverlaySize } from "@voom/types/recorder";
import {
  CIRCLE_DIAMETER_DEFAULT,
  CIRCLE_DIAMETER_MAX,
  CIRCLE_DIAMETER_MIN,
} from "@voom/types/recorder";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { useRecorder } from "@voom/hooks/useRecorder";
import type { CameraOverlayState, RecorderOptions } from "@voom/types/recorder";
import { CameraOverlay } from "./CameraOverlay";
import { RecorderControls } from "./RecorderControls";

const DEFAULT_OVERLAY: CameraOverlayState = {
  xRatio: 0.78,
  yRatio: 0.02,
  circleDiameterPx: 222,
  isFullScreen: false,
};

/**
 * Contenedor principal del recorder: preview de cámara, opciones, controles y descarga.
 * La lógica de grabación está en useRecorder; aquí solo se orquesta la UI.
 */
export function Recorder() {
  const [options, setOptions] = useState<RecorderOptions>({
    screen: true,
    microphone: true,
    camera: true,
    resolution: "720p",
    frameRate: 60,
    performanceMode: true,
    circleDiameterPx: CIRCLE_DIAMETER_DEFAULT,
  });

  const overlayRef = useRef<CameraOverlayState | null>(DEFAULT_OVERLAY);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewOverlaySize, setPreviewOverlaySize] =
    useState<CameraOverlaySize>("small");

  const overlayIsAvatar = previewOverlaySize === "avatar";
  const cameraPreviewVideoEnabled = options.camera && !overlayIsAvatar;
  const { user } = useAuth();
  const avatarPhotoUrl = user?.photoURL ?? null;

  const {
    status,
    error,
    recordingResult,
    startRecording,
    stopRecording,
    downloadRecording,
    reset,
    camera,
  } = useRecorder(
    options,
    overlayRef,
    cameraPreviewVideoEnabled,
    avatarPhotoUrl,
    overlayIsAvatar,
    true,
  );

  const handleOptionsChange = useCallback((newOptions: RecorderOptions) => {
    setOptions(newOptions);
  }, []);

  const handleCircleDiameterChange = useCallback((diameterPx: number) => {
    setOptions((prev) => ({
      ...prev,
      circleDiameterPx: Math.min(
        CIRCLE_DIAMETER_MAX,
        Math.max(CIRCLE_DIAMETER_MIN, diameterPx)
      ),
    }));
  }, []);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Voom Recorder</CardTitle>
        <CardDescription>
          Activa pantalla, micrófono y/o cámara. Arrastra la cámara y elige
          tamaño (S/M/L/Pantalla completa). Marca &quot;Compartir audio&quot;
          para incluir música o sonido. En PCs con poca RAM o CPU, activa
          &quot;Modo rendimiento&quot;. Inicia la grabación y descarga el video
          al terminar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <span className="text-sm font-medium">
            Vista previa (posición de la cámara en el video)
          </span>
          <div
            ref={previewContainerRef}
            className="relative aspect-video w-full max-w-full overflow-hidden rounded-lg border bg-muted"
          >
            {options.camera &&
              (camera.stream || previewOverlaySize === "avatar") && (
              <CameraOverlay
                stream={camera.stream}
                overlayRef={overlayRef}
                containerRef={previewContainerRef}
                className="rounded-lg"
                avatarPhotoUrl={avatarPhotoUrl}
                onOverlaySizeChange={setPreviewOverlaySize}
                circleDiameterPx={
                  options.circleDiameterPx ?? CIRCLE_DIAMETER_DEFAULT
                }
                onCircleDiameterChange={handleCircleDiameterChange}
              />
            )}
            {options.camera &&
              !camera.stream &&
              previewOverlaySize !== "avatar" && (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Cargando cámara…
              </div>
            )}
            {!options.camera && (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Activa la cámara para ver la vista previa
              </div>
            )}
          </div>
        </div>

        <RecorderControls
          status={status}
          options={options}
          onOptionsChange={handleOptionsChange}
          onStart={startRecording}
          onStop={stopRecording}
          onDownload={downloadRecording}
          onReset={reset}
          canDownload={!!recordingResult}
          cameraOverlaySize={previewOverlaySize}
        />

        {recordingResult && (
          <p className="text-sm text-muted-foreground">
            Duración: {recordingResult.durationSeconds.toFixed(1)} s
          </p>
        )}
      </CardContent>
    </Card>
  );
}
