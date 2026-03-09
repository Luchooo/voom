/**
 * Recorta un video WebM por tiempo de inicio y fin en el navegador (FFmpeg.wasm).
 * -c copy para no re-codificar; salida en WebM.
 */

import { getFFmpeg } from "./ffmpegClient";

/**
 * Recorta el video entre startSeconds y endSeconds (inclusive del inicio, exclusive del fin
 * en la práctica; FFmpeg -to es exclusive).
 * @param webmBlob Blob del video WebM (p. ej. grabación de MediaRecorder).
 * @param startSeconds Segundo de inicio (0 ≤ start < end).
 * @param endSeconds Segundo de fin (start < end ≤ duración).
 * @returns Nuevo Blob WebM recortado.
 */
export async function trimWebm(
	webmBlob: Blob,
	startSeconds: number,
	endSeconds: number,
): Promise<Blob> {
	if (startSeconds < 0 || endSeconds <= startSeconds) {
		throw new Error("Intervalo inválido: inicio debe ser < fin y ambos positivos.");
	}
	const ffmpeg = await getFFmpeg();
	const input = new Uint8Array(await webmBlob.arrayBuffer());
	await ffmpeg.writeFile("trim_input.webm", input);
	// -ss antes de -i para seek rápido; -t = duración de salida (sin re-codificar).
	const durationOut = endSeconds - startSeconds;
	await ffmpeg.exec([
		"-ss",
		String(startSeconds),
		"-i",
		"trim_input.webm",
		"-t",
		String(durationOut),
		"-c",
		"copy",
		"trim_output.webm",
	]);
	const data = await ffmpeg.readFile("trim_output.webm");
	await ffmpeg.deleteFile("trim_input.webm");
	await ffmpeg.deleteFile("trim_output.webm");
	const bytes =
		data instanceof Uint8Array
			? data
			: new Uint8Array(data as unknown as ArrayBuffer);
	const buffer = bytes.buffer.slice(
		bytes.byteOffset,
		bytes.byteOffset + bytes.byteLength,
	) as ArrayBuffer;
	return new Blob([buffer], { type: "video/webm" });
}
