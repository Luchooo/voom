"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	PreviewVideoPlayer,
	type PreviewVideoPlayerHandle,
} from "@voom/components/PreviewVideoPlayer";
import { trimWebm } from "@voom/lib/trimVideo";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
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
 * Editor minimalista de recorte: mismo reproductor que la vista previa,
 * barra de opciones (inicio/fin, aplicar/cancelar) fija al fondo.
 */
export function TrimEditorStep({
	videoUrl,
	blob,
	durationSeconds,
	onApplyTrim,
	onCancel,
}: TrimEditorStepProps) {
	const playerRef = useRef<PreviewVideoPlayerHandle>(null);
	const [startTime, setStartTime] = useState(0);
	const [endTime, setEndTime] = useState(Math.max(MIN_SEGMENT_S, durationSeconds));
	const [isTrimming, setIsTrimming] = useState(false);
	const [trimError, setTrimError] = useState<string | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);

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
		playerRef.current?.seekTo(startClamped);
	}, [startClamped]);

	const handleApply = useCallback(async () => {
		setConfirmOpen(false);
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
		<div className="flex min-h-full flex-col">
			{/* Mismo tamaño y centrado que la preview "Grabación lista": max-w-4xl, h-auto */}
			<div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
				<p className="text-center text-sm text-muted-foreground">
					Recorta el inicio o el final. Mín. {MIN_SEGMENT_S} s.
				</p>
				<div className="w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-neutral-900 shadow-2xl">
					<PreviewVideoPlayer ref={playerRef} src={videoUrl} className="h-auto w-full" />
				</div>
			</div>

			{/* Barra de opciones de recorte fija al fondo */}
			<div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.15)] backdrop-blur-sm">
				<div className="mx-auto flex max-w-4xl flex-col gap-4">
					{trimError && (
						<p className="rounded-lg bg-destructive/15 px-4 py-2 text-sm text-destructive">
							{trimError}
						</p>
					)}
					<div className="grid gap-4 sm:grid-cols-2">
						<label className="flex items-center gap-3 text-sm">
							<span className="w-12 shrink-0 text-muted-foreground">Inicio</span>
							<input
								type="range"
								min={0}
								max={Math.max(0, duration - MIN_SEGMENT_S)}
								step={0.5}
								value={startClamped}
								onChange={(e) => setStart(Number(e.target.value))}
								className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-orange-600"
							/>
							<span className="w-12 shrink-0 tabular-nums text-foreground">
								{formatTime(startClamped)}
							</span>
						</label>
						<label className="flex items-center gap-3 text-sm">
							<span className="w-12 shrink-0 text-muted-foreground">Fin</span>
							<input
								type="range"
								min={startClamped + MIN_SEGMENT_S}
								max={duration}
								step={0.5}
								value={endClamped}
								onChange={(e) => setEnd(Number(e.target.value))}
								className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-orange-600"
							/>
							<span className="w-12 shrink-0 tabular-nums text-foreground">
								{formatTime(endClamped)}
							</span>
						</label>
					</div>
					<div className="flex flex-wrap items-center justify-between gap-3">
						<span className="text-sm text-muted-foreground">
							Tramo seleccionado: <strong className="text-foreground">{formatTime(segmentDuration)}</strong>
						</span>
						<div className="flex flex-wrap items-center gap-3">
							<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
								<button
									type="button"
									onClick={() => setConfirmOpen(true)}
									disabled={isTrimming}
									className="flex min-w-40 items-center justify-center gap-2 rounded-lg bg-orange-600 px-6 py-2.5 font-semibold text-white hover:bg-orange-500 disabled:opacity-70"
								>
									{isTrimming && <Spinner size="sm" className="shrink-0" />}
									{isTrimming ? "Recortando…" : "Aplicar recorte"}
								</button>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>¿Aplicar recorte?</AlertDialogTitle>
										<AlertDialogDescription>
											Se creará una nueva versión del video con el tramo seleccionado. El original y las ediciones anteriores seguirán disponibles en la pestaña del botón Editar video.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancelar</AlertDialogCancel>
										<AlertDialogAction onClick={() => void handleApply()}>
											Sí, aplicar recorte
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
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
				</div>
			</div>

			{/* Espaciador para que el contenido no quede oculto tras la barra fija */}
			<div className="h-[200px] shrink-0" aria-hidden />
		</div>
	);
}
