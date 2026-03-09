"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Layout cliente de /record: solo verifica sesión y redirige si no hay usuario.
 * El Sidebar está dentro de RecordPageClient para que se vea correctamente con el blur del flujo.
 */
export function RecordLayoutClient({
	children,
}: {
	children: React.ReactNode;
}) {
	const { user, loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (loading) return;
		if (!user) router.replace("/");
	}, [loading, user, router]);

	if (loading) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4">
				<div className="size-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
				<p className="text-muted-foreground">Verificando sesión…</p>
			</div>
		);
	}

	if (!user) {
		return null;
	}

	return <>{children}</>;
}
