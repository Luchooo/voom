"use client";

/**
 * Se muestra cuando el navegador no soporta compartir pantalla (getDisplayMedia).
 * Común en móviles; en escritorio usar Chrome, Firefox o Edge.
 */
export function DisplayMediaUnsupportedStep() {
	return (
		<div className="flex min-h-full flex-col items-center justify-center gap-6 p-8 text-center">
			<div
				className="rounded-xl border border-amber-500/50 bg-amber-500/10 px-6 py-5 text-foreground"
				role="alert"
			>
				<p className="font-semibold text-amber-600 dark:text-amber-400">
					Voom no puede ejecutarse en este dispositivo
				</p>
				<p className="mt-2 text-sm text-muted-foreground">
					Tu navegador no admite compartir pantalla (API no disponible). En
					móviles esta función suele no estar soportada. Para grabar con Voom,
					usa un navegador de escritorio actual (Chrome, Firefox o Edge).
				</p>
			</div>
		</div>
	);
}
