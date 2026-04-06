"use client";

import { Button } from "../../components/ui/button";
import { DiscardRecordingDialog } from "./RecordingFlow/DiscardRecordingDialog";
import type {
  CameraOverlaySize,
  RecorderOptions,
  RecorderStatus,
  RecordingFrameRate,
  RecordingResolution,
} from "@voom/types/recorder";
import {
  CIRCLE_DIAMETER_DEFAULT,
  CIRCLE_DIAMETER_MAX,
  CIRCLE_DIAMETER_MIN,
} from "@voom/types/recorder";

interface RecorderControlsProps {
  status: RecorderStatus;
  options: RecorderOptions;
  onOptionsChange: (options: RecorderOptions) => void;
  onStart: () => void;
  onStop: () => void;
  onDownload: () => void;
  onReset: () => void;
  canDownload: boolean;
  /** Tamaño del overlay en la vista previa (texto del slider de diámetro). */
  cameraOverlaySize?: CameraOverlaySize;
}

const statusLabels: Record<RecorderStatus, string> = {
  idle: "Listo",
  requesting: "Preparando…",
  recording: "Grabando",
  stopping: "Finalizando…",
  ready: "Listo para descargar",
};

const RESOLUTION_OPTIONS: { value: RecordingResolution; label: string }[] = [
  { value: "720p", label: "720p" },
  { value: "1080p", label: "1080p" },
  { value: "native", label: "Nativo" },
];

const FRAMERATE_OPTIONS: { value: RecordingFrameRate; label: string }[] = [
  { value: 30, label: "30 fps" },
  { value: 60, label: "60 fps" },
  { value: 120, label: "120 fps" },
];

export function RecorderControls({
  status,
  options,
  onOptionsChange,
  onStart,
  onStop,
  onDownload,
  onReset,
  canDownload,
  cameraOverlaySize = "small",
}: RecorderControlsProps) {
  const isBusy = status === "requesting" || status === "stopping";
  const isRecording = status === "recording";

  const toggle = (key: keyof RecorderOptions, value: boolean) => {
    onOptionsChange({ ...options, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={options.screen}
            onChange={(e) => toggle("screen", e.target.checked)}
            disabled={isRecording}
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-sm font-medium">Pantalla</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={options.microphone}
            onChange={(e) => toggle("microphone", e.target.checked)}
            disabled={isRecording}
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-sm font-medium">Micrófono</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={options.camera}
            onChange={(e) => toggle("camera", e.target.checked)}
            disabled={isRecording}
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-sm font-medium">Cámara</span>
        </label>
        <label className="flex items-center gap-2" title="Recomendado en PCs con poca RAM o CPU (más fluido, menos carga)">
          <input
            type="checkbox"
            checked={options.performanceMode ?? false}
            onChange={(e) =>
              onOptionsChange({ ...options, performanceMode: e.target.checked })
            }
            disabled={isRecording}
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-sm font-medium">Modo rendimiento</span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Resolución</span>
          <select
            value={options.resolution}
            onChange={(e) =>
              onOptionsChange({
                ...options,
                resolution: e.target.value as RecordingResolution,
              })
            }
            disabled={isRecording}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            {RESOLUTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">FPS</span>
          <select
            value={options.frameRate}
            onChange={(e) =>
              onOptionsChange({
                ...options,
                frameRate: Number(e.target.value) as RecordingFrameRate,
              })
            }
            disabled={isRecording}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            {FRAMERATE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {options.camera && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium">
              {cameraOverlaySize === "avatar"
                ? "Tu avatar a cámara"
                : "Tamaño del círculo de cámara"}
            </span>
            <span className="text-xs text-muted-foreground">
              {options.circleDiameterPx ?? CIRCLE_DIAMETER_DEFAULT} px
            </span>
          </div>
          <p className="mb-2 text-xs text-muted-foreground">
            {cameraOverlaySize === "avatar"
              ? "Así de grande te verán en el video (100–600 px). ¡Pruébalo!"
              : "Diámetro del círculo (100–600 px)"}
          </p>
          <input
            type="range"
            min={CIRCLE_DIAMETER_MIN}
            max={CIRCLE_DIAMETER_MAX}
            step={10}
            value={options.circleDiameterPx ?? CIRCLE_DIAMETER_DEFAULT}
            onChange={(e) =>
              onOptionsChange({
                ...options,
                circleDiameterPx: Math.min(
                  CIRCLE_DIAMETER_MAX,
                  Math.max(CIRCLE_DIAMETER_MIN, e.target.valueAsNumber)
                ),
              })
            }
            disabled={isRecording}
            className="w-full max-w-md accent-orange-500"
          />
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span
          className={`h-2 w-2 rounded-full ${
            isRecording
              ? "animate-pulse bg-destructive"
              : "bg-muted-foreground/50"
          }`}
        />
        {statusLabels[status]}
      </div>

      <div className="flex flex-wrap gap-2">
        {!isRecording && status !== "ready" && (
          <Button onClick={onStart} disabled={isBusy || !options.screen}>
            Iniciar grabación
          </Button>
        )}
        {isRecording && (
          <Button variant="destructive" onClick={onStop}>
            Detener grabación
          </Button>
        )}
        {canDownload && (
          <>
            <Button variant="secondary" onClick={onDownload}>
              Descargar video
            </Button>
            <DiscardRecordingDialog
              onConfirm={onReset}
              trigger={
                <Button type="button" variant="outline">
                  Nueva grabación
                </Button>
              }
            />
          </>
        )}
      </div>
    </div>
  );
}
