import Image from "next/image";
import { LandingAuthCTA } from "./components/landing/LandingAuthCTA";
import { LandingHeader } from "./components/landing/LandingHeader";

/**
 * Landing tipo Loom: hero, valor, CTA "Continue with Google" → /record.
 * Raíz /; el flujo de grabación vive en /record (protegido por auth).
 */
export default function Home() {
	return (
		<div className="min-h-screen flex flex-col bg-background text-foreground">
			<LandingHeader />

			{/* Hero */}
			<main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:py-24">
				<h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
					Un video vale más que mil palabras
				</h1>
				<p className="mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
					Graba tu pantalla y cámara en segundos. Sin instalación, desde el navegador. Descarga al instante.
				</p>
				<div className="mt-10">
					<LandingAuthCTA />
				</div>
				<div className="mt-12 w-full max-w-5xl overflow-hidden rounded-xl border border-border shadow-2xl">
					<Image
						src="/hero.png"
						alt="Persona grabando su pantalla con un clic. Interfaz de Voom con botón de grabar en naranja."
						width={1920}
						height={1080}
						priority
						className="h-auto w-full object-cover"
					/>
				</div>
			</main>

			{/* Bloque de valor / features (estilo Loom) */}
			<section className="border-t border-border/50 bg-muted/30 py-16">
				<div className="mx-auto max-w-6xl px-4">
					<h2 className="text-center text-2xl font-semibold sm:text-3xl">
						Grabación de pantalla en pocos clics
					</h2>
					<p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
						Comparte pantalla, cámara y micrófono. Recorta el video si te sobra el inicio o el final. Todo en el navegador, sin instalar nada.
					</p>
					<ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
						<li className="rounded-xl border border-border bg-card p-6 shadow-sm">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
								<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
								</svg>
							</div>
							<h3 className="mt-4 font-semibold">Pantalla y cámara</h3>
							<p className="mt-2 text-sm text-muted-foreground">
								Graba la pantalla con tu cámara en un círculo ajustable. Activa o desactiva micrófono y cámara al gusto.
							</p>
						</li>
						<li className="rounded-xl border border-border bg-card p-6 shadow-sm">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
								<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<h3 className="mt-4 font-semibold">Recorta al instante</h3>
							<p className="mt-2 text-sm text-muted-foreground">
								Quita el inicio o el final del video sin salir de la app. Varias versiones y siempre puedes volver al original.
							</p>
						</li>
						<li className="rounded-xl border border-border bg-card p-6 shadow-sm">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
								<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
								</svg>
							</div>
							<h3 className="mt-4 font-semibold">Descarga ya</h3>
							<p className="mt-2 text-sm text-muted-foreground">
								Descarga en WebM o, si lo prefieres, en MP4. Todo se procesa en tu navegador, sin subir el video a ningún servidor.
							</p>
						</li>
					</ul>
					<div className="mt-12 text-center">
						<LandingAuthCTA variant="sm" />
					</div>
				</div>
			</section>

			<footer className="border-t border-border/50 py-6">
				<div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
					Voom — Graba pantalla y cámara desde el navegador
				</div>
			</footer>
		</div>
	);
}
