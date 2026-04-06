"use client";

import {
	IoPlay,
	IoPause,
	IoPlaySkipBackOutline,
	IoPlaySkipForwardOutline,
	IoVolumeHighOutline,
	IoVolumeMuteOutline,
	IoExpandOutline,
	IoContractOutline,
} from "react-icons/io5";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Button } from "../../components/ui/button";

const SEEK_STEP_S = 5;
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function formatTime(s: number): string {
	if (!Number.isFinite(s) || s < 0) return "0:00";
	const m = Math.floor(s / 60);
	const sec = Math.floor(s % 60);
	return `${m}:${sec.toString().padStart(2, "0")}`;
}

export interface PreviewVideoPlayerProps {
	src: string;
	className?: string;
}

export interface PreviewVideoPlayerHandle {
	seekTo: (seconds: number) => void;
}

/**
 * Reproductor de vista previa con controles tipo Loom:
 * play/pause, ±5s, volumen, barra de progreso (roja), tiempo actual/total, velocidad, PiP, pantalla completa.
 * Ref opcional expone seekTo(seconds) para uso en editor de recorte.
 */
export const PreviewVideoPlayer = forwardRef<
	PreviewVideoPlayerHandle,
	PreviewVideoPlayerProps
>(function PreviewVideoPlayer({ src, className = "" }, ref) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useImperativeHandle(ref, () => ({
		seekTo(seconds: number) {
			const v = videoRef.current;
			if (v) v.currentTime = Math.max(0, seconds);
		},
	}), []);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(1);
	const [muted, setMuted] = useState(false);
	const [playbackRate, setPlaybackRate] = useState(1);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [showSpeedMenu, setShowSpeedMenu] = useState(false);

	const updateTime = useCallback(() => {
		const v = videoRef.current;
		if (v) {
			setCurrentTime(v.currentTime);
			if (Number.isFinite(v.duration)) setDuration(v.duration);
		}
	}, []);

	useEffect(() => {
		const v = videoRef.current;
		if (!v) return;
		v.addEventListener("timeupdate", updateTime);
		v.addEventListener("loadedmetadata", updateTime);
		v.addEventListener("durationchange", updateTime);
		v.addEventListener("ended", () => setIsPlaying(false));
		return () => {
			v.removeEventListener("timeupdate", updateTime);
			v.removeEventListener("loadedmetadata", updateTime);
			v.removeEventListener("durationchange", updateTime);
		};
	}, [updateTime]);

	useEffect(() => {
		const v = videoRef.current;
		if (!v) return;
		v.playbackRate = playbackRate;
	}, [playbackRate]);

	useEffect(() => {
		const v = videoRef.current;
		if (!v) return;
		v.volume = muted ? 0 : volume;
	}, [volume, muted]);

	const handleVolumeChange = useCallback((newVolume: number) => {
		const v = Math.max(0, Math.min(1, newVolume));
		setVolume(v);
		if (v > 0) setMuted(false);
		if (v === 0) setMuted(true);
	}, []);

	const togglePlay = useCallback(() => {
		const v = videoRef.current;
		if (!v) return;
		if (v.paused) {
			v.play().then(() => setIsPlaying(true));
		} else {
			v.pause();
			setIsPlaying(false);
		}
	}, []);

	const seek = useCallback((delta: number) => {
		const v = videoRef.current;
		if (!v) return;
		v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + delta));
		updateTime();
	}, [updateTime]);

	const setSeek = useCallback(
		(t: number) => {
			const v = videoRef.current;
			if (!v) return;
			v.currentTime = Math.max(0, Math.min(Number.isFinite(v.duration) ? v.duration : 0, t));
			updateTime();
		},
		[updateTime],
	);

	const handleProgressClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			const bar = e.currentTarget;
			const rect = bar.getBoundingClientRect();
			const ratio = (e.clientX - rect.left) / rect.width;
			const d = duration || 0;
			setSeek(ratio * d);
		},
		[duration, setSeek],
	);

	const toggleFullscreen = useCallback(() => {
		const container = containerRef.current;
		if (!container) return;
		if (!document.fullscreenElement) {
			container.requestFullscreen().then(() => setIsFullscreen(true));
		} else {
			document.exitFullscreen().then(() => setIsFullscreen(false));
		}
	}, []);

	useEffect(() => {
		const handler = () => setIsFullscreen(!!document.fullscreenElement);
		document.addEventListener("fullscreenchange", handler);
		return () => document.removeEventListener("fullscreenchange", handler);
	}, []);

	const togglePiP = useCallback(async () => {
		const v = videoRef.current;
		if (!v || !document.pictureInPictureEnabled) return;
		try {
			if (document.pictureInPictureElement) {
				await document.exitPictureInPicture();
			} else {
				await v.requestPictureInPicture();
			}
		} catch {
			// PiP no soportado o denegado
		}
	}, []);

	const canPiP = typeof document !== "undefined" && document.pictureInPictureEnabled;
	const total = duration > 0 ? duration : 0;
	const progress = total > 0 ? (currentTime / total) * 100 : 0;

	const fsRoot = isFullscreen
		? "h-full min-h-0 w-full max-h-[100dvh] rounded-none border-0 bg-black shadow-none"
		: "";
	const fsVideoShell = isFullscreen
		? "flex min-h-0 flex-1 items-center justify-center"
		: "";
	const videoClass = isFullscreen
		? "max-h-full max-w-full h-auto w-auto object-contain bg-black"
		: "mx-auto block h-auto max-h-[min(58vh,calc(100svh-20rem))] w-full object-contain bg-black";

	return (
		<div
			ref={containerRef}
			className={`flex flex-col overflow-hidden rounded-xl border border-border bg-neutral-900 shadow-2xl ${fsRoot} ${className}`}
		>
			{/* En embebido: altura natural. En :fullscreen el contenedor llena el viewport: el área del vídeo crece (flex-1) y el vídeo se escala con object-contain para no dejar un bloque vacío debajo de los controles. */}
			<div className={`w-full bg-black ${fsVideoShell}`}>
				<video
					ref={videoRef}
					src={src}
					playsInline
					className={videoClass}
					onClick={togglePlay}
					preload="metadata"
				/>
			</div>
			{/* Barra de controles (estilo Loom: fondo oscuro, barra roja de progreso) */}
			<div className="flex shrink-0 flex-col gap-1 bg-neutral-900 px-3 py-2">
				{/* Barra de progreso */}
				<div
					role="slider"
					aria-valuemin={0}
					aria-valuemax={total}
					aria-valuenow={currentTime}
					aria-label="Posición del video"
					className="group relative h-1.5 w-full cursor-pointer rounded-full bg-neutral-700"
					onClick={handleProgressClick}
				>
					<div
						className="absolute left-0 top-0 h-full rounded-full bg-red-500 transition-[width]"
						style={{ width: `${progress}%` }}
					/>
					<div
						className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-red-500 opacity-0 shadow transition-opacity group-hover:opacity-100"
						style={{ left: `calc(${progress}% - 6px)` }}
					/>
				</div>
				{/* Controles y tiempo */}
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-1">
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={togglePlay}
							className="h-10 w-10 text-neutral-200 hover:bg-neutral-700 hover:text-white [&_svg]:h-5 [&_svg]:w-5"
							aria-label={isPlaying ? "Pausar" : "Reproducir"}
						>
							{isPlaying ? (
								<IoPause className="h-5 w-5" />
							) : (
								<IoPlay className="h-5 w-5" />
							)}
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={() => seek(-SEEK_STEP_S)}
							className="h-10 w-10 gap-0.5 text-neutral-200 hover:bg-neutral-700 hover:text-white [&_svg]:h-5 [&_svg]:w-5"
							aria-label={`Retroceder ${SEEK_STEP_S} segundos`}
						>
							<IoPlaySkipBackOutline className="h-5 w-5" />
							<span className="text-xs font-medium">5</span>
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={() => seek(SEEK_STEP_S)}
							className="h-10 w-10 gap-0.5 text-neutral-200 hover:bg-neutral-700 hover:text-white [&_svg]:h-5 [&_svg]:w-5"
							aria-label={`Avanzar ${SEEK_STEP_S} segundos`}
						>
							<IoPlaySkipForwardOutline className="h-5 w-5" />
							<span className="text-xs font-medium">5</span>
						</Button>
						{/* Volumen: icono (mute/unmute) + slider para subir/bajar */}
						<div className="flex items-center gap-1">
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => {
									if (muted) {
										setMuted(false);
										if (volume === 0) setVolume(1);
									} else {
										setMuted(true);
									}
								}}
								className="h-10 w-10 text-neutral-200 hover:bg-neutral-700 hover:text-white [&_svg]:h-5 [&_svg]:w-5"
								aria-label={muted ? "Activar sonido" : "Silenciar"}
							>
								{muted || volume === 0 ? (
									<IoVolumeMuteOutline className="h-5 w-5" />
								) : (
									<IoVolumeHighOutline className="h-5 w-5" />
								)}
							</Button>
							<input
								type="range"
								min={0}
								max={1}
								step={0.05}
								value={muted ? 0 : volume}
								onChange={(e) => handleVolumeChange(Number(e.target.value))}
								className="h-1.5 w-16 cursor-pointer appearance-none rounded-full bg-neutral-700 accent-red-500 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neutral-200 [&::-webkit-slider-thumb]:shadow"
								aria-label="Volumen"
							/>
						</div>
					</div>
					<span className="tabular-nums text-sm text-neutral-300">
						{formatTime(currentTime)} / {formatTime(total)}
					</span>
					<div className="flex items-center gap-0.5">
						{/* Velocidad */}
						<div className="relative">
							<Button
								type="button"
								variant="ghost"
								onClick={() => setShowSpeedMenu((s) => !s)}
								className="h-9 text-neutral-300 hover:bg-neutral-700 hover:text-white"
								aria-expanded={showSpeedMenu}
								aria-haspopup="true"
								aria-label="Velocidad de reproducción"
							>
								{playbackRate}x
							</Button>
							{showSpeedMenu && (
								<>
									<div
										className="fixed inset-0 z-10"
										aria-hidden
										onClick={() => setShowSpeedMenu(false)}
									/>
									<ul
										className="absolute bottom-full right-0 z-20 mb-1 max-h-48 overflow-auto rounded-lg border border-border bg-neutral-800 py-1 shadow-xl"
										role="menu"
									>
										{SPEED_OPTIONS.map((rate) => (
											<li key={rate} role="none">
												<Button
													type="button"
													variant="ghost"
													role="menuitem"
													onClick={() => {
														setPlaybackRate(rate);
														setShowSpeedMenu(false);
													}}
													className={`h-auto w-full justify-start px-4 py-2 text-sm font-normal ${
														playbackRate === rate
															? "bg-red-600 text-white hover:bg-red-600 hover:text-white"
															: "text-neutral-200 hover:bg-neutral-700"
													}`}
												>
													{rate}x
												</Button>
											</li>
										))}
									</ul>
								</>
							)}
						</div>
						{canPiP && (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={togglePiP}
								className="h-10 w-10 text-neutral-200 hover:bg-neutral-700 hover:text-white [&_svg]:h-5 [&_svg]:w-5"
								aria-label="Picture-in-picture"
							>
								{/* Icono PiP: ventana pequeña dentro de una grande */}
								<svg
									className="h-5 w-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden
								>
									<rect x="2" y="2" width="14" height="14" rx="1" strokeWidth={2} />
									<rect x="8" y="8" width="14" height="14" rx="1" strokeWidth={2} />
								</svg>
							</Button>
						)}
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={toggleFullscreen}
							className="h-10 w-10 text-neutral-200 hover:bg-neutral-700 hover:text-white [&_svg]:h-5 [&_svg]:w-5"
							aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
						>
							{isFullscreen ? (
								<IoContractOutline className="h-5 w-5" />
							) : (
								<IoExpandOutline className="h-5 w-5" />
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
});
