import type { Metadata } from "next";
import { mp4Option } from "../flags";
import { RecordPageClient } from "./RecordPageClient";

export const metadata: Metadata = {
	title: "Grabar video | Voom",
	description: "Graba tu pantalla, cámara y micrófono. Recorta y descarga el video al instante.",
};

/**
 * Página de grabación (protegida): flujo completo tras login con Google.
 * Middleware redirige a / si no hay sesión; el cliente muestra loading y logout.
 */
export default async function RecordPage() {
	const showMp4Option = await mp4Option();
	return <RecordPageClient showMp4Option={showMp4Option} />;
}
