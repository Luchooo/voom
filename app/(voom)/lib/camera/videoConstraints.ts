/**
 * Construcción de MediaTrackConstraints para getUserMedia(video)
 * a partir del perfil de rendimiento y del tamaño en UI.
 *
 * Usa ideal/max para que el navegador negocie con la cámara sin fallar:
 * nunca pedir exact con resoluciones que la cámara podría no soportar.
 */

import type { PerformanceProfile } from "./performanceProfile";
import { PROFILE_LIMITS } from "./performanceProfile";
import { getOptimalCameraResolution } from "./resolutionCalculator";

export interface CameraConstraintsInput {
  /** Perfil de rendimiento (low/medium/high). */
  profile: PerformanceProfile;
  /** Diámetro en px del círculo en la UI (ej. 120, 222, 400). Si no se pasa, se usan los límites del perfil. */
  uiSizePx?: number;
  /** deviceId de la cámara seleccionada por el usuario (enumerateDevices). */
  deviceId?: string;
}

/**
 * Construye las constraints de video para getUserMedia.
 * - Combina límites del perfil (maxWidth, maxHeight, maxFps) con la resolución óptima para uiSizePx.
 * - Incluye deviceId cuando el usuario eligió una cámara concreta.
 */
export function buildVideoConstraints(input: CameraConstraintsInput): MediaTrackConstraints {
  const { profile, uiSizePx, deviceId } = input;
  const limits = PROFILE_LIMITS[profile];

  const { width, height } = uiSizePx
    ? getOptimalCameraResolution(uiSizePx, limits.maxWidth, limits.maxHeight)
    : { width: limits.maxWidth, height: limits.maxHeight };

  const constraints: MediaTrackConstraints = {
    width: { ideal: width, max: limits.maxWidth },
    height: { ideal: height, max: limits.maxHeight },
    frameRate: { ideal: limits.maxFps, max: limits.maxFps },
    facingMode: "user",
  };

  if (deviceId) {
    constraints.deviceId = { exact: deviceId };
  }

  return constraints;
}
