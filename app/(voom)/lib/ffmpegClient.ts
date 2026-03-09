/**
 * Cliente FFmpeg.wasm compartido (trim, conversión WebM→MP4).
 * Una sola instancia cargada bajo demanda.
 */

let ffmpegInstance: import("@ffmpeg/ffmpeg").FFmpeg | null = null;

export async function getFFmpeg(): Promise<import("@ffmpeg/ffmpeg").FFmpeg> {
	if (ffmpegInstance) return ffmpegInstance;
	const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
		import("@ffmpeg/ffmpeg"),
		import("@ffmpeg/util"),
	]);
	const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
	const ffmpeg = new FFmpeg();
	await ffmpeg.load({
		coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
		wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
	});
	ffmpegInstance = ffmpeg;
	return ffmpeg;
}
