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
  CountdownSeconds,
} from "@voom/types/recorder";
import {
  CIRCLE_DIAMETER_MIN,
  CIRCLE_DIAMETER_MAX,
  CIRCLE_DIAMETER_DEFAULT,
} from "@voom/types/recorder";
import { useTheme } from "next-themes";

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
const COUNTDOWN_OPTIONS: { value: CountdownSeconds; label: string }[] = [
  { value: 3, label: "3 s" },
  { value: 6, label: "6 s" },
  { value: 10, label: "10 s" },
];

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
  const { theme, setTheme } = useTheme();
  const devicesSectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

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

  // Cargar lista de dispositivos al mostrar la vista "Dispositivos" para que el botón muestre siempre el nombre correcto
  useEffect(() => {
    if (view !== "devices") return;
    const t = setTimeout(() => {
      loadDevices("audioinput");
      loadDevices("videoinput");
    }, 0);
    return () => clearTimeout(t);
  }, [view, loadDevices]);

  // Si el dispositivo guardado (localStorage) ya no está en la lista → usar predeterminado del sistema
  useEffect(() => {
    if (audioDevices.length === 0 && videoDevices.length === 0) return;
    const updates: Partial<RecorderOptions> = {};
    if (audioDevices.length > 0 && options.audioDeviceId && !audioDevices.some((d) => d.deviceId === options.audioDeviceId)) {
      updates.audioDeviceId = undefined;
    }
    if (videoDevices.length > 0 && options.videoDeviceId && !videoDevices.some((d) => d.deviceId === options.videoDeviceId)) {
      updates.videoDeviceId = undefined;
    }
    if (Object.keys(updates).length > 0) {
      onOptionsChange({ ...options, ...updates });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- options/onOptionsChange omitidos a propósito para evitar bucle al limpiar deviceId
  }, [audioDevices, videoDevices]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (devicesSectionRef.current && !devicesSectionRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cerrar configuración al hacer clic fuera de la card (como un modal)
  useEffect(() => {
    if (view !== "settings") return;
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setView("devices");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [view]);

  const micDevice = audioDevices.find((d) => d.deviceId === options.audioDeviceId);
  const micIndex = options.audioDeviceId ? audioDevices.findIndex((d) => d.deviceId === options.audioDeviceId) : -1;
  const micInList = micIndex >= 0;
  const selectedMicLabel =
    !options.audioDeviceId || !micInList
      ? "Predeterminado"
      : (micDevice?.label?.trim() || `Micrófono ${micIndex + 1}`);
  const cameraDevice = videoDevices.find((d) => d.deviceId === options.videoDeviceId);
  const cameraIndex = options.videoDeviceId ? videoDevices.findIndex((d) => d.deviceId === options.videoDeviceId) : -1;
  const cameraInList = cameraIndex >= 0;
  const selectedCameraLabel =
    !options.videoDeviceId || !cameraInList
      ? "Predeterminada"
      : (cameraDevice?.label?.trim() || `Cámara ${cameraIndex + 1}`);

  return (
    <Card
      ref={cardRef}
      className="absolute right-6 top-6 z-10 w-72 border-border bg-card/95 shadow-xl backdrop-blur-md"
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 pt-4">
        {view === "devices" ? (
          <>
            <h3 className="text-sm font-medium text-card-foreground">Dispositivos</h3>
            <button
              type="button"
              onClick={() => setView("settings")}
              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-card-foreground"
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
              className="flex items-center gap-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-card-foreground"
              aria-label="Volver"
            >
              <BackIcon className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-medium text-card-foreground">Configuración</h3>
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
                <span className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                  {options.camera ? (
                    <CameraIcon className="h-4 w-4 shrink-0" />
                  ) : (
                    <CameraOffIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
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
                          className="relative h-6 w-11 shrink-0 cursor-not-allowed rounded-full bg-muted opacity-70"
                        >
                          <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-primary shadow translate-x-0" />
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
                      options.camera ? "bg-green-500" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-primary shadow transition-transform ${
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
                  className={`flex w-full items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 text-left text-sm text-card-foreground ${
                    cameraNotFound
                      ? "cursor-not-allowed bg-muted/50 opacity-60"
                      : "bg-muted/50 hover:bg-muted hover:border-muted-foreground/30"
                  }`}
                  aria-expanded={openDropdown === "camera"}
                  aria-haspopup="listbox"
                >
                  <span className="min-w-0 truncate">{selectedCameraLabel}</span>
                  <ChevronDownIcon
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${openDropdown === "camera" ? "rotate-180" : ""}`}
                  />
                </button>
                {openDropdown === "camera" && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-auto rounded-lg border border-border bg-card py-1 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setOption("videoDeviceId", undefined);
                      setOpenDropdown(null);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-card-foreground hover:bg-muted"
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
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted ${
                        options.videoDeviceId === d.deviceId ? "bg-accent text-accent-foreground" : "text-card-foreground"
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
                <span className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                  {options.microphone ? (
                    <IoMicOutline className="h-4 w-4 shrink-0" />
                  ) : (
                    <IoMicOffOutline className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  Micrófono
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={options.microphone}
                  onClick={() => toggle("microphone", !options.microphone)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    options.microphone ? "bg-green-500" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-primary shadow transition-transform ${
                      options.microphone ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={openMicDropdown}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-left text-sm text-card-foreground hover:bg-muted hover:border-muted-foreground/30"
                  aria-expanded={openDropdown === "mic"}
                  aria-haspopup="listbox"
                >
                  <span className="min-w-0 truncate">{selectedMicLabel}</span>
                  <ChevronDownIcon
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${openDropdown === "mic" ? "rotate-180" : ""}`}
                  />
                </button>
                {openDropdown === "mic" && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-auto rounded-lg border border-border bg-card py-1 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setOption("audioDeviceId", undefined);
                      setOpenDropdown(null);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-card-foreground hover:bg-muted"
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
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted ${
                        options.audioDeviceId === d.deviceId ? "bg-accent text-accent-foreground" : "text-card-foreground"
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
            <label className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-card-foreground">Voltear cámara</p>
                <p className="text-xs text-muted-foreground">
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
                  options.flipCamera !== false ? "bg-green-500" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-primary shadow transition-transform ${
                    options.flipCamera !== false ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </label>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-medium text-card-foreground">Tamaño del círculo de cámara</p>
                <span className="text-xs text-muted-foreground">
                  {options.circleDiameterPx ?? CIRCLE_DIAMETER_DEFAULT} px
                </span>
              </div>
              <p className="mb-2 text-xs text-muted-foreground">
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

            <div>
              <p className="mb-1 text-sm font-medium text-card-foreground">Cuenta regresiva</p>
              <p className="mb-2 text-xs text-muted-foreground">
                Tiempo antes de iniciar la grabación (segundos)
              </p>
              <div
                className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5"
                role="group"
                aria-label="Segundos de cuenta regresiva"
              >
                {COUNTDOWN_OPTIONS.map(({ value, label }, i) => {
                  const isSelected = (options.countdownSeconds ?? 3) === value;
                  const roundClass =
                    i === 0
                      ? "rounded-l-md"
                      : i === COUNTDOWN_OPTIONS.length - 1
                        ? "rounded-r-md"
                        : "rounded-none";
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setOption("countdownSeconds", value)}
                      className={`${roundClass} px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-background ${
                        isSelected
                          ? "bg-card text-card-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-card-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1 text-sm font-medium text-card-foreground hover:text-card-foreground [&::-webkit-details-marker]:hidden">
                <span>Opciones avanzadas</span>
                <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-4 pt-3">
                <div>
                  <p className="mb-1 text-sm font-medium text-card-foreground">Apariencia</p>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Tema claro, oscuro o seguir el sistema
                  </p>
                  <select
                    value={theme ?? "system"}
                    onChange={(e) => setTheme(e.target.value as "system" | "light" | "dark")}
                    className="w-full rounded-lg border border-border bg-muted/50 py-2 pl-3 pr-8 text-sm text-card-foreground focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="system">Sistema</option>
                    <option value="light">Claro</option>
                    <option value="dark">Oscuro</option>
                  </select>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-card-foreground">Calidad de video</p>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Resolución de la captura de pantalla
                  </p>
                  <select
                    value={options.resolution}
                    onChange={(e) => setOption("resolution", e.target.value as RecordingResolution)}
                    className="w-full rounded-lg border border-border bg-muted/50 py-2 pl-3 pr-8 text-sm text-card-foreground focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                    <option value="native">Nativa</option>
                  </select>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-card-foreground">Fotogramas por segundo</p>
                  <p className="mb-2 text-xs text-muted-foreground">
                    FPS del video grabado (30, 60 o 120)
                  </p>
                  <select
                    value={options.frameRate}
                    onChange={(e) =>
                      setOption("frameRate", Number(e.target.value) as RecordingFrameRate)
                    }
                    className="w-full rounded-lg border border-border bg-muted/50 py-2 pl-3 pr-8 text-sm text-card-foreground focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    {FPS_OPTIONS.map((fps) => (
                      <option key={fps} value={fps}>
                        {fps} FPS
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">Modo rendimiento</p>
                    <p className="text-xs text-muted-foreground">
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
                      options.performanceMode ? "bg-green-500" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-primary shadow transition-transform ${
                        options.performanceMode ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </label>
                {onClearSettings && (
                  <button
                    type="button"
                    onClick={onClearSettings}
                    className="w-full rounded-lg border border-border py-2 text-sm text-muted-foreground hover:bg-muted hover:text-card-foreground"
                  >
                    Borrar configuración guardada
                  </button>
                )}
              </div>
            </details>
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
