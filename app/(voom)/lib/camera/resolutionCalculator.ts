/**
 * Cálculo de resolución óptima de cámara según el tamaño en el que se renderiza en la UI.
 *
 * Problema: pedir 1080p cuando el video se muestra en un círculo de 120px procesa
 * ~144x más píxeles de los necesarios y causa lag.
 *
 * Estrategia:
 * - idealWidth ≈ uiSizePx * factorRetina (típ. 2) para pantallas HiDPI.
 * - Redondear a resoluciones estándar para que el navegador/cámara negocien bien.
 * - Nunca superar el techo del perfil (performanceProfile).
 */


/** Resoluciones estándar (ancho) para elegir la más cercana sin pasarse. */
const STANDARD_WIDTHS = [160, 320, 480, 640, 720, 960, 1280];

export interface OptimalResolution {
  width: number;
  height: number;
}

/**
 * Calcula la resolución óptima para el stream de cámara dado el tamaño de visualización en la UI.
 *
 * Fórmula: necesitamos al menos (uiSizePx * retina) de ancho para verse nítido;
 * luego cap por maxWidth/maxHeight del perfil y redondeamos a una resolución estándar.
 *
 * @param uiSizePx - Diámetro del círculo (o lado mayor) en píxeles en pantalla (ej. 120, 222, 400).
 * @param maxWidth - Límite de ancho (del perfil de rendimiento).
 * @param maxHeight - Límite de alto (del perfil de rendimiento).
 * @param retinaFactor - Multiplicador para HiDPI; por defecto 2.
 */
export function getOptimalCameraResolution(
  uiSizePx: number,
  maxWidth: number,
  maxHeight: number,
  retinaFactor?: number
): OptimalResolution {
  const factor = retinaFactor ?? getRetinaFactor();
  const idealRaw = Math.ceil(uiSizePx * factor);
  const candidates = STANDARD_WIDTHS.filter((w) => w >= idealRaw && w <= maxWidth);
  const width =
    candidates.length > 0
      ? Math.min(candidates[0], maxWidth)
      : Math.min(
          STANDARD_WIDTHS.filter((w) => w <= maxWidth).pop() ?? STANDARD_WIDTHS[0],
          maxWidth
        );
  const height = Math.min(Math.round((width * 9) / 16), maxHeight);
  return { width, height };
}

/**
 * Devuelve el factor retina a usar (para tests o override).
 */
export function getRetinaFactor(): number {
  return typeof window !== "undefined" ? Math.min(2, window.devicePixelRatio || 2) : 2;
}
