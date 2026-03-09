/**
 * Helpers para descargar archivos en el navegador.
 */

/**
 * Fuerza la descarga de un Blob con el nombre de archivo indicado.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Genera un nombre de archivo con timestamp para el video grabado.
 */
export function getRecordingFilename(extension = "webm"): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return `voom-recording-${date}-${time}.${extension}`;
}
