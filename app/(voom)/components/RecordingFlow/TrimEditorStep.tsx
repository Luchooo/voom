"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trimWebm } from "@voom/lib/trimVideo";
import { Spinner } from "../../../components/ui/spinner";

const MIN_SEGMENT_S = 1;

function formatTime(s: number): string {
	const m = Math.floor(s / 60);
	const sec = Math.floor(s % 60);
	return `${m}:${sec.toString().padStart(2, "0")}`;
}

export interface TrimEditorStepProps {
	/** URL del video (object URL) para previsualización */
	videoUrl: string;
	/** Blob del video para enviar a FFmpeg */
	blob: Blob;
	/** Duración total en segundos */
	durationSeconds: number;
	onApplyTrim: (trimmedBlob: Blob, newDurationSeconds: number) => void;
	onCancel: () => void;
}

/**
 * Editor minimalista de recorte: sliders de inicio/fin, previsualización, aplicar recorte.
 * Solo recorta inicio o final (un segmento continuo).
 */
export function TrimEditorStep({
	videoUrl,
	blob,
	durationSeconds,
	onApplyTrim,
	onCancel,
}: TrimEditorStepProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [startTime, setStartTime] = useState(0);
	const [endTime, setEndTime] = useState(Math.max(MIN_SEGMENT_S, durationSeconds));
	const [isTrimming, setIsTrimming] = useState(false);
	const [trimError, setTrimError] = useState<string | null>(null);

	// Sincronizar endTime con duración real al cargar el video
	useEffect(() => {
		if (durationSeconds > 0 && endTime > durationSeconds) {
			setEndTime(durationSeconds);
		}
	}, [durationSeconds]);

	const duration = Math.max(0, durationSeconds);
	const startClamped = Math.max(0, Math.min(startTime, duration - MIN_SEGMENT_S));
	const endClamped = Math.max(startClamped + MIN_SEGMENT_S, Math.min(endTime, duration));

	const setStart = useCallback((v: number) => {
		const s = Math.max(0, Math.min(v, duration - MIN_SEGMENT_S));
		setStartTime(s);
		setEndTime((prev) => (prev <= s ? s + MIN_SEGMENT_S : prev));
	}, [duration]);
	const setEnd = useCallback((v: number) => {
		const e = Math.max(MIN_SEGMENT_S, Math.min(v, duration));
		setEndTime(e);
		setStartTime((prev) => (prev >= e ? e - MIN_SEGMENT_S : prev));
	}, [duration]);

	// Previsualización: al cambiar inicio, buscar en el video
	useEffect(() => {
		const v = videoRef.current;
		if (!v) return;
		v.currentTime = startClamped;
	}, [startClamped]);

	const handleApply = useCallback(async () => {
		setTrimError(null);
		setIsTrimming(true);
		try {
			const trimmed = await trimWebm(blob, startClamped, endClamped);
			const newDuration = endClamped - startClamped;
			onApplyTrim(trimmed, newDuration);
		} catch (err) {
			setTrimError(err instanceof Error ? err.message : "Error al recortar el video");
		} finally {
			setIsTrimming(false);
		}
	}, [blob, startClamped, endClamped, onApplyTrim]);

	const segmentDuration = endClamped - startClamped;

	return (
		<div className="flex min-h-full flex-col gap-6 p-6">
			<p className="text-center text-sm text-muted-foreground">
				Recorta el inicio o el final del video. Mínimo {MIN_SEGMENT_S} s de duración.
			</p>
			<div className="flex flex-1 flex-col gap-4">
				<div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
					<video
						ref={videoRef}
						src={videoUrl}
						controls
						playsInline
						className="h-auto w-full"
						onLoadedMetadata={() => {
							if (videoRef.current && durationSeconds > 0)
								videoRef.current.currentTime = startClamped;
						}}
					/>
				</div>
				<div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
					<div className="flex items-center justify-between gap-4 text-sm">
						<label className="flex items-center gap-2">
							<span className="text-muted-foreground">Inicio</span>
							<input
								type="range"
								min={0}
								max={Math.max(0, duration - MIN_SEGMENT_S)}
								step={0.5}
								value={startClamped}
								onChange={(e) => setStart(Number(e.target.value))}
								className="h-2 w-32 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-orange-600 sm:w-40"
							/>
							<span className="tabular-nums text-foreground w-10">
								{formatTime(startClamped)}
							</span>
						</label>
					</div>
					<div className="flex items-center justify-between gap-4 text-sm">
						<label className="flex items-center gap-2">
							<span className="text-muted-foreground">Fin</span>
							<input
								type="range"
								min={startClamped + MIN_SEGMENT_S}
								max={duration}
								step={0.5}
								value={endClamped}
								onChange={(e) => setEnd(Number(e.target.value))}
								className="h-2 w-32 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-orange-600 sm:w-40"
							/>
							<span className="tabular-nums text-foreground w-10">
								{formatTime(endClamped)}
							</span>
						</label>
					</div>
					<p className="text-xs text-muted-foreground">
						Tramo seleccionado: {formatTime(segmentDuration)}
					</p>
				</div>
			</div>
			{trimError && (
				<p className="rounded-lg bg-destructive/15 px-4 py-2 text-sm text-destructive">
					{trimError}
				</p>
			)}
			<div className="flex flex-wrap items-center justify-center gap-3">
				<button
					type="button"
					onClick={handleApply}
					disabled={isTrimming}
					className="flex min-w-40 items-center justify-center gap-2 rounded-lg bg-orange-600 px-6 py-2.5 font-semibold text-white hover:bg-orange-500 disabled:opacity-70"
				>
					{isTrimming && <Spinner size="sm" className="shrink-0" />}
					{isTrimming ? "Recortando…" : "Aplicar recorte"}
				</button>
				<button
					type="button"
					onClick={onCancel}
					disabled={isTrimming}
					className="rounded-lg border-2 border-border bg-muted px-6 py-2.5 font-semibold text-foreground hover:bg-muted/80 disabled:opacity-70"
				>
					Cancelar
				</button>
			</div>
		</div>
	);
}
