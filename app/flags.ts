/**
 * Definición de feature flags (Vercel Flags).
 * Se evalúan solo en el servidor; pasar el valor a client components como prop.
 * Sin FLAGS en env (p. ej. local sin Vercel) se usa defaultValue y no se lanza error.
 * @see https://vercel.com/docs/flags/vercel-flags/quickstart
 */
import { flag } from "flags/next";
import { vercelAdapter } from "@flags-sdk/vercel";

const hasFlagsEnv = typeof process.env.FLAGS === "string" && process.env.FLAGS.length > 0;

/** Muestra la opción "Descargar en .mp4" en el botón de descarga (conversión en el navegador). Activarla para testers. */
export const mp4Option = flag<boolean>({
  key: "mp4-option",
  ...(hasFlagsEnv
    ? { adapter: vercelAdapter() }
    : { decide: () => false }),
  defaultValue: false,
  description: "Mostrar opción de descarga en MP4 (conversión en el navegador)",
  options: [
    { value: false, label: "Ocultar" },
    { value: true, label: "Mostrar (testers)" },
  ],
});
