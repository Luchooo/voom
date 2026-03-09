import { RecordLayoutClient } from "./RecordLayoutClient";

/**
 * Layout de /record: Sidebar (shadcn) con datos del usuario y cerrar sesión,
 * y área principal con el contenido de la página.
 */
export default function RecordLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <RecordLayoutClient>{children}</RecordLayoutClient>;
}
