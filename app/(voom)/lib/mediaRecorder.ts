/**
 * Detección de MIME type soportado por MediaRecorder.
 * VP9 codifica mejor pero usa más CPU; en modo rendimiento preferimos VP8 para fluidez en PCs lentos.
 */
const VP9_OPUS = "video/webm;codecs=vp9,opus";
const VP8_OPUS = "video/webm;codecs=vp8,opus";
const FALLBACK_LEGACY = "video/webm";

export function getSupportedMimeType(preferLowCpu = false): string {
  if (typeof MediaRecorder === "undefined") return FALLBACK_LEGACY;
  if (preferLowCpu) {
    if (MediaRecorder.isTypeSupported(VP8_OPUS)) return VP8_OPUS;
    if (MediaRecorder.isTypeSupported(VP9_OPUS)) return VP9_OPUS;
    return FALLBACK_LEGACY;
  }
  if (MediaRecorder.isTypeSupported(VP9_OPUS)) return VP9_OPUS;
  if (MediaRecorder.isTypeSupported(VP8_OPUS)) return VP8_OPUS;
  return FALLBACK_LEGACY;
}
