/**
 * Convierte un Blob WebM a MP4 en el navegador usando FFmpeg.wasm.
 * Se carga bajo demanda (solo cuando el usuario pide descarga en MP4).
 */

let ffmpegInstance: import('@ffmpeg/ffmpeg').FFmpeg | null = null;

async function getFFmpeg(): Promise<import('@ffmpeg/ffmpeg').FFmpeg> {
	if (ffmpegInstance) return ffmpegInstance;
	const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
		import('@ffmpeg/ffmpeg'),
		import('@ffmpeg/util'),
	]);
	const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';
	const ffmpeg = new FFmpeg();
	await ffmpeg.load({
		coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
		wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
	});
	ffmpegInstance = ffmpeg;
	return ffmpeg;
}

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
