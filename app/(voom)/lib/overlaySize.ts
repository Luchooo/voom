import type { CameraOverlaySize } from "@voom/types/recorder";
import { CIRCLE_DIAMETER_PX } from "@voom/types/recorder";

/** Diámetro orientativo en la UI; pequeño/grande fijos; avatar sigue `circleDiameterPx` (p. ej. 120 por defecto). */
export const CIRCLE_PREVIEW_PX: Record<CameraOverlaySize, number> = {
  small: 222,
  large: 400,
  fullscreen: 222, // en preview mostramos un círculo; en grabación es full
  avatar: 120,
};

export function getOverlayLabel(size: CameraOverlaySize): string {
  const labels: Record<CameraOverlaySize, string> = {
    small: "Pequeño (222px)",
    large: "Grande (400px)",
    fullscreen: "Pantalla completa",
    avatar: "Avatar (icono)",
  };
  return labels[size];
}

export { CIRCLE_DIAMETER_PX };
