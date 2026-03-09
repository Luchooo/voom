/**
 * Motor de optimización de cámara: combina perfil de hardware, tamaño en UI
 * y cámara seleccionada para producir constraints óptimas y evitar pedir
 * 1080p cuando el video se muestra en un círculo pequeño.
 */

import { getPerformanceProfile } from "./performanceProfile";
import { buildVideoConstraints } from "./videoConstraints";
import type { CameraConstraintsInput } from "./videoConstraints";

export interface OptimalCameraConstraintsInput {
  /** Si true, forzar perfil "low" (modo rendimiento manual). */
  forcePerformanceMode?: boolean;
  /** Diámetro en px del círculo de cámara en la UI (ej. 120, 222, 400). */
  uiSizePx?: number;
  /** deviceId de la cámara elegida por el usuario. */
  deviceId?: string;
}

/**
 * Devuelve las constraints de video óptimas para getUserMedia.
 *
 * Algoritmo:
 * 1. Perfil = forcePerformanceMode ? "low" : getPerformanceProfile() (por hardware).
 * 2. Si hay uiSizePx, la resolución ideal se calcula para ese tamaño (+ factor retina).
 * 3. Se aplican los límites del perfil (max width/height/fps).
 * 4. Se incluye deviceId cuando el usuario eligió una cámara.
 */
export function getOptimalCameraConstraints(
  input: OptimalCameraConstraintsInput = {}
): MediaTrackConstraints {
  const profile = input.forcePerformanceMode ? "low" : getPerformanceProfile();
  const constraintsInput: CameraConstraintsInput = {
    profile,
    uiSizePx: input.uiSizePx,
    deviceId: input.deviceId,
  };
  return buildVideoConstraints(constraintsInput);
}

// Re-exportar para uso directo
export { getPerformanceProfile, isLowEndDevice } from "./performanceProfile";
export type { PerformanceProfile } from "./performanceProfile";
export { getOptimalCameraResolution } from "./resolutionCalculator";
export { buildVideoConstraints } from "./videoConstraints";
export type { CameraConstraintsInput } from "./videoConstraints";
