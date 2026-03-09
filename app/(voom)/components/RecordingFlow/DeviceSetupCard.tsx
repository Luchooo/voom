"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IoMicOutline, IoMicOffOutline } from "react-icons/io5";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import type {
  RecorderOptions,
  RecordingResolution,
  RecordingFrameRate,
} from "@voom/types/recorder";
import {
  CIRCLE_DIAMETER_MIN,
  CIRCLE_DIAMETER_MAX,
  CIRCLE_DIAMETER_DEFAULT,
} from "@voom/types/recorder";

interface DeviceSetupCardProps {
  options: RecorderOptions;
  onOptionsChange: (options: RecorderOptions) => void;
  onStartRecording: () => void;
  onClearSettings?: () => void;
  isRequestingScreen: boolean;
  /** Cuando no se detectó ninguna cámara: el switch queda deshabilitado y se muestra un tooltip. */
  cameraNotFound?: boolean;
}

const FPS_OPTIONS: RecordingFrameRate[] = [30, 60, 120];

/** Card fija arriba a la derecha: dispositivos con iconos, selector de mic/cámara, CTA y Settings */
export function DeviceSetupCard({
  options,
  onOptionsChange,
  onStartRecording,
  onClearSettings,
  isRequestingScreen,
  cameraNotFound = false,
}: DeviceSetupCardProps) {
  const [view, setView] = useState<"devices" | "settings">("devices");
  const [openDropdown, setOpenDropdown] = useState<null | "mic" | "camera">(null);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const devicesSectionRef = useRef<HTMLDivElement>(null);

  const toggle = (key: "camera" | "microphone", value: boolean) => {
    onOptionsChange({ ...options, [key]: value });
  };

  const setOption = <K extends keyof RecorderOptions>(key: K, value: RecorderOptions[K]) => {
    onOptionsChange({ ...options, [key]: value });
  };

  const loadDevices = useCallback(async (kind: "audioinput" | "videoinput") => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const list = devices.filter((d) => d.kind === kind);
      if (kind === "audioinput") setAudioDevices(list);
      else setVideoDevices(list);
    } catch {
      if (kind === "audioinput") setAudioDevices([]);
      else setVideoDevices([]);
    }
  }, []);

  const openMicDropdown = useCallback(() => {
    setOpenDropdown((prev) => (prev === "mic" ? null : "mic"));
    loadDevices("audioinput");
  }, [loadDevices]);

  const openCameraDropdown = useCallback(() => {
    setOpenDropdown((prev) => (prev === "camera" ? null : "camera"));
    loadDevices("videoinput");
  }, [loadDevices]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (devicesSectionRef.current && !devicesSectionRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedMicLabel =
    audioDevices.find((d) => d.deviceId === options.audioDeviceId)?.label ||
    (options.audioDeviceId ? "Micrófono" : "Predeterminado");
  const selectedCameraLabel =
    videoDevices.find((d) => d.deviceId === options.videoDeviceId)?.label ||
    (options.videoDeviceId ? "Cámara" : "Predeterminada");

  return (
    <Card className="absolute right-6 top-6 z-10 w-72 border-white/20 bg-black/70 shadow-xl backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 pt-4">
        {view === "devices" ? (
          <>
            <h3 className="text-sm font-medium text-white">Dispositivos</h3>
            <button
              type="button"
              onClick={() => setView("settings")}
              className="rounded p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
              title="Configuración"
              aria-label="Abrir configuración"
            >
              <SettingsIcon className="h-5 w-5" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setView("devices")}
              className="flex items-center gap-1 rounded p-1 text-white/90 hover:bg-white/15 hover:text-white"
              aria-label="Volver"
            >
              <BackIcon className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-medium text-white">Configuración</h3>
            <span className="w-9" />
          </>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {view === "devices" && (
          <div ref={devicesSectionRef} className="space-y-5">
            {/* Cámara: título + toggle en una línea; selector en la siguiente */}
            <div className="relative space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-white">
                  {options.camera ? (
                    <CameraIcon className="h-4 w-4 shrink-0" />
                  ) : (
                    <CameraOffIcon className="h-4 w-4 shrink-0 text-white/50" />
                  )}
                  Cámara
                </span>
                {cameraNotFound ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-not-allowed [&_button]:pointer-events-none">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={false}
                          disabled
                          aria-disabled
                          className="relative h-6 w-11 shrink-0 cursor-not-allowed rounded-full bg-white/30 opacity-70"
                        >
                          <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow translate-x-0" />
                        </button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      No encontramos ninguna cámara.
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={options.camera}
                    onClick={() => toggle("camera", !options.camera)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                      options.camera ? "bg-green-500" : "bg-white/30"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        options.camera ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={cameraNotFound ? undefined : openCameraDropdown}
                  disabled={cameraNotFound}
                  aria-disabled={cameraNotFound}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg border border-white/25 px-3 py-2.5 text-left text-sm text-white ${
                    cameraNotFound
                      ? "cursor-not-allowed bg-white/5 opacity-60"
                      : "bg-white/5 hover:border-white/40 hover:bg-white/10"
                  }`}
                  aria-expanded={openDropdown === "camera"}
                  aria-haspopup="listbox"
                >
                  <span className="min-w-0 truncate">{selectedCameraLabel}</span>
                  <ChevronDownIcon
                    className={`h-4 w-4 shrink-0 text-white/70 transition-transform ${openDropdown === "camera" ? "rotate-180" : ""}`}
                  />
                </button>
                {openDropdown === "camera" && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-auto rounded-lg border border-white/25 bg-neutral-900 py-1 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setOption("videoDeviceId", undefined);
                      setOpenDropdown(null);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-white hover:bg-white/10"
                  >
                    <CameraIcon className="h-4 w-4 shrink-0" />
                    Predeterminada
                  </button>
                  {videoDevices.map((d) => (
                    <button
                      key={d.deviceId}
                      type="button"
                      onClick={() => {
                        setOption("videoDeviceId", d.deviceId);
                        setOpenDropdown(null);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-white/10 ${
                        options.videoDeviceId === d.deviceId ? "bg-blue-600/40 text-white" : "text-white/90"
                      }`}
                    >
                      <CameraIcon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{d.label || `Cámara ${d.deviceId.slice(0, 8)}`}</span>
                      {options.videoDeviceId === d.deviceId && (
                        <CheckIcon className="ml-auto h-4 w-4 shrink-0" />
                      )}
                    </button>
                  ))}
                  </div>
                )}
              </div>
            </div>

            {/* Micrófono: mismo patrón */}
            <div className="relative space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-white">
                  {options.microphone ? (
                    <IoMicOutline className="h-4 w-4 shrink-0" />
                  ) : (
                    <IoMicOffOutline className="h-4 w-4 shrink-0 text-white/50" />
                  )}
                  Micrófono
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={options.microphone}
                  onClick={() => toggle("microphone", !options.microphone)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    options.microphone ? "bg-green-500" : "bg-white/30"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      options.microphone ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={openMicDropdown}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/25 bg-white/5 px-3 py-2.5 text-left text-sm text-white hover:border-white/40 hover:bg-white/10"
                  aria-expanded={openDropdown === "mic"}
                  aria-haspopup="listbox"
                >
                  <span className="min-w-0 truncate">{selectedMicLabel}</span>
                  <ChevronDownIcon
                    className={`h-4 w-4 shrink-0 text-white/70 transition-transform ${openDropdown === "mic" ? "rotate-180" : ""}`}
                  />
                </button>
                {openDropdown === "mic" && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-auto rounded-lg border border-white/25 bg-neutral-900 py-1 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setOption("audioDeviceId", undefined);
                      setOpenDropdown(null);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-white hover:bg-white/10"
                  >
                    <IoMicOutline className="h-4 w-4 shrink-0" />
                    Predeterminado
                  </button>
                  {audioDevices.map((d) => (
                    <button
                      key={d.deviceId}
                      type="button"
                      onClick={() => {
                        setOption("audioDeviceId", d.deviceId);
                        setOpenDropdown(null);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-white/10 ${
                        options.audioDeviceId === d.deviceId ? "bg-blue-600/40 text-white" : "text-white/90"
                      }`}
                    >
                      <IoMicOutline className="h-4 w-4 shrink-0" />
                      <span className="truncate">{d.label || `Micrófono ${d.deviceId.slice(0, 8)}`}</span>
                      {options.audioDeviceId === d.deviceId && (
                        <CheckIcon className="ml-auto h-4 w-4 shrink-0" />
                      )}
                    </button>
                  ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onStartRecording}
              disabled={isRequestingScreen}
              className="w-full rounded-lg bg-orange-600 py-2.5 font-medium text-white hover:bg-orange-500 disabled:opacity-50"
            >
              {isRequestingScreen ? "Selecciona qué compartir…" : "Iniciar grabación"}
            </button>
          </div>
        )}

        {view === "settings" && (
          <div className="space-y-5">
            <div>
              <p className="mb-1 text-sm font-medium text-white">Calidad de video</p>
              <p className="mb-2 text-xs text-white/60">
                Resolución de la captura de pantalla
              </p>
              <select
                value={options.resolution}
                onChange={(e) => setOption("resolution", e.target.value as RecordingResolution)}
                className="w-full rounded-lg border border-white/20 bg-white/10 py-2 pl-3 pr-8 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="720p" className="bg-neutral-900 text-white">
                  720p
                </option>
                <option value="1080p" className="bg-neutral-900 text-white">
                  1080p
                </option>
                <option value="native" className="bg-neutral-900 text-white">
                  Nativa
                </option>
              </select>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-white">Fotogramas por segundo</p>
              <p className="mb-2 text-xs text-white/60">
                FPS del video grabado (30, 60 o 120)
              </p>
              <select
                value={options.frameRate}
                onChange={(e) =>
                  setOption("frameRate", Number(e.target.value) as RecordingFrameRate)
                }
                className="w-full rounded-lg border border-white/20 bg-white/10 py-2 pl-3 pr-8 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                {FPS_OPTIONS.map((fps) => (
                  <option key={fps} value={fps} className="bg-neutral-900 text-white">
                    {fps} FPS
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-white">Modo rendimiento</p>
                <p className="text-xs text-white/60">
                  Menos carga en PCs con poca RAM o CPU
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={options.performanceMode ?? false}
                onClick={() =>
                  setOption("performanceMode", !(options.performanceMode ?? false))
                }
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  options.performanceMode ? "bg-green-500" : "bg-white/30"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    options.performanceMode ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </label>
            <label className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-white">Voltear cámara</p>
                <p className="text-xs text-white/60">
                  Voltea la orientación de la cámara (espejo)
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={options.flipCamera !== false}
                onClick={() =>
                  setOption("flipCamera", options.flipCamera === false)
                }
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  options.flipCamera !== false ? "bg-green-500" : "bg-white/30"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    options.flipCamera !== false ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </label>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-medium text-white">Tamaño del círculo de cámara</p>
                <span className="text-xs text-white/60">
                  {options.circleDiameterPx ?? CIRCLE_DIAMETER_DEFAULT} px
                </span>
              </div>
              <p className="mb-2 text-xs text-white/60">
                Diámetro del círculo (100–600 px)
              </p>
              <input
                type="range"
                min={CIRCLE_DIAMETER_MIN}
                max={CIRCLE_DIAMETER_MAX}
                step={10}
                value={options.circleDiameterPx ?? CIRCLE_DIAMETER_DEFAULT}
                onChange={(e) =>
                  setOption("circleDiameterPx", Math.min(CIRCLE_DIAMETER_MAX, Math.max(CIRCLE_DIAMETER_MIN, e.target.valueAsNumber)))
                }
                className="w-full accent-orange-500"
              />
            </div>
            {onClearSettings && (
              <button
                type="button"
                onClick={onClearSettings}
                className="w-full rounded-lg border border-white/20 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
              >
                Borrar configuración guardada
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 17v2a2 2 0 01-2 2H7a2 2 0 01-2-2v-2" />
    </svg>
  );
}

function CameraOffIcon({ className }: { className?: string }) {
  return (
    <span className={`relative inline-block ${className ?? ""}`} aria-hidden>
      <svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="h-px w-full rotate-45 bg-current" />
      </span>
    </span>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
}
