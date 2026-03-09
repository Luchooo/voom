/**
 * Convierte un Blob WebM a MP4 en el navegador usando FFmpeg.wasm.
 * Se carga bajo demanda (solo cuando el usuario pide descarga en MP4).
 */

import { getFFmpeg } from "./ffmpegClient";

/**
 * Convierte un Blob de video WebM a MP4 con alta calidad (sin pérdida perceptible).
 * CRF 18 + preset slow mantienen la calidad; puede tardar según la duración.
 */
export async function convertWebmToMp4(webmBlob: Blob): Promise<Blob> {
	const ffmpeg = await getFFmpeg();
	const input = new Uint8Array(await webmBlob.arrayBuffer());
	await ffmpeg.writeFile('input.webm', input);
	await ffmpeg.exec(['-i', 'input.webm', 'output.mp4']);
	const data = await ffmpeg.readFile('output.mp4');
	await ffmpeg.deleteFile('input.webm');
	await ffmpeg.deleteFile('output.mp4');
	const bytes =
		data instanceof Uint8Array
			? data
			: new Uint8Array(data as unknown as ArrayBuffer);
	const buffer = bytes.buffer.slice(
		bytes.byteOffset,
		bytes.byteOffset + bytes.byteLength,
	) as ArrayBuffer;
	return new Blob([buffer], { type: 'video/mp4' });
}
