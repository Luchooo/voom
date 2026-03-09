import type { Metadata } from "next";
import { mp4Option } from "../flags";
import { RecorderPage } from "@voom/RecorderPage";

export const metadata: Metadata = {
	title: "Grabar video | Voom",
	description: "Graba tu pantalla, cámara y micrófono. Recorta y descarga el video al instante.",
};

/**
 * Página de grabación: flujo completo (bienvenida, dispositivos, countdown, grabar, preview, editar).
 * La landing está en / y redirige aquí con el CTA "Comenzar a grabar video".
 */
export default async function RecordPage() {
	const showMp4Option = await mp4Option();
	return <RecorderPage showMp4Option={showMp4Option} />;
}
