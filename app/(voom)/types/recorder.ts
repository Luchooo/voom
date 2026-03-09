/**
 * Tipos del feature de grabación.
 * Centraliza interfaces y estados del recorder para mantener consistencia.
 */

/** Resolución de captura de pantalla */
export type RecordingResolution = "720p" | "1080p" | "native";

/** Fotogramas por segundo de la grabación */
export type RecordingFrameRate = 30 | 60 | 120;

/** Cuatro estados del overlay de cámara: pequeño, grande, pantalla completa o avatar (icono) */
export type CameraOverlaySize = "small" | "large" | "fullscreen" | "avatar";

/** Diámetro en píxeles del círculo en el video grabado (small=222, large=400) */
export const CIRCLE_DIAMETER_PX = { small: 222, large: 400 } as const;

/** Estado del overlay de cámara: posición, tamaño y modo (circle px, fullscreen o avatar) */
export interface CameraOverlayState {
  xRatio: number;
  yRatio: number;
  /** Para círculos: diámetro en píxeles en el video (222 o 400). Ignorado si isFullScreen. */
  circleDiameterPx?: number;
  /** true = cámara a pantalla completa en el video */
  isFullScreen: boolean;
  /** true = no cámara, mostrar icono por defecto en la misma posición/tamaño */
  isAvatar?: boolean;
}

/** Opciones de captura que el usuario puede activar/desactivar */
export interface RecorderOptions {
  screen: boolean;
  microphone: boolean;
  camera: boolean;
  /** Resolución: 720p, 1080p o nativa de la pantalla */
  resolution: RecordingResolution;
  /** FPS: 30, 60 o 120 (120 requiere pantalla 120Hz y soporte del navegador) */
  frameRate: RecordingFrameRate;
  /** Modo rendimiento: reduce carga en PCs con poca RAM/CPU (VP8, cámara baja res, menos FPS canvas) */
  performanceMode?: boolean;
  /** deviceId del micrófono elegido (enumerateDevices audioinput) */
  audioDeviceId?: string;
  /** deviceId de la cámara elegida (enumerateDevices videoinput) */
  videoDeviceId?: string;
  /** Voltear orientación de la cámara (espejo) */
  flipCamera?: boolean;
  /** Diámetro del círculo de cámara en px (100–600). Usado cuando el modo es small o large. */
  circleDiameterPx?: number;
}

export const CIRCLE_DIAMETER_MIN = 100;
export const CIRCLE_DIAMETER_MAX = 600;
export const CIRCLE_DIAMETER_DEFAULT = 222;
/** Diámetro del círculo en modo avatar (icono de persona). */
export const AVATAR_CIRCLE_DIAMETER = 120;

/** Estado posible de la grabación */
export type RecorderStatus =
  | "idle"       // Sin grabar, listo para iniciar
  | "requesting" // Solicitando permisos / preparando streams
  | "recording"  // Grabando
  | "stopping"   // Deteniendo y generando video
  | "ready";    // Grabación finalizada, listo para descargar

/** Estados del flujo de pre-grabación (welcome, configuración, countdown, etc.) */
export type RecordingFlowState =
  | "welcome"                  // Overlay con botón "Grabar"
  | "device_setup"             // Configuración: cámara circular + card derecha
  | "awaiting_screen_selection" // Diálogo getDisplayMedia abierto
  | "countdown"                // Cuenta regresiva 3, 2, 1
  | "recording"                 // Grabando
  | "ready"                    // Grabación lista para descargar
  | "cancelled";               // Usuario canceló (ej. share screen)

/** Errores tipados que puede emitir el recorder */
export interface RecorderError {
  source: "screen" | "microphone" | "camera" | "recorder" | "unknown";
  message: string;
  cause?: unknown;
}

/** Resultado de la grabación una vez finalizada */
export interface RecordingResult {
  blob: Blob;
  url: string;
  /** Duración en segundos (aproximada) */
  durationSeconds: number;
}
