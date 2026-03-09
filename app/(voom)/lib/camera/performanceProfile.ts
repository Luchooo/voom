/**
 * Perfil de rendimiento según hardware del dispositivo.
 * Usa navigator.hardwareConcurrency y navigator.deviceMemory (cuando está disponible)
 * para clasificar en low / medium / high y así limitar resolución y FPS de la cámara.
 *
 * Referencia tipo Loom: en dispositivos limitados se pide 360p–480p y 15–24 fps
 * para evitar lag y alto uso de CPU.
 */

export type PerformanceProfile = "low" | "medium" | "high";

/** Límites por perfil: resolución máxima de cámara (ancho) y FPS máximo. */
export const PROFILE_LIMITS: Record<
  PerformanceProfile,
  { maxWidth: number; maxHeight: number; maxFps: number }
> = {
  low: { maxWidth: 320, maxHeight: 180, maxFps: 15 },
  medium: { maxWidth: 640, maxHeight: 360, maxFps: 24 },
  high: { maxWidth: 960, maxHeight: 540, maxFps: 30 },
};

/**
 * Detecta el perfil de rendimiento del dispositivo.
 * - low: ≤2 cores o ≤2 GB RAM → 360p, 15 fps
 * - medium: ≤4 cores o ≤4 GB RAM → 480p, 24 fps
 * - high: resto → hasta 540p, 30 fps
 *
 * deviceMemory no está disponible en todos los navegadores (Chrome sí).
 */
export function getPerformanceProfile(): PerformanceProfile {
  if (typeof navigator === "undefined") return "medium";

  const cores = navigator.hardwareConcurrency ?? 2;
  const memoryGB = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;

  if (cores <= 2 || memoryGB <= 2) return "low";
  if (cores <= 4 || memoryGB <= 4) return "medium";
  return "high";
}

/**
 * Indica si el dispositivo se considera de bajo rendimiento.
 * Útil para activar automáticamente el "modo rendimiento" en la UI.
 */
export function isLowEndDevice(): boolean {
  return getPerformanceProfile() === "low";
}
