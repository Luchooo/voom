"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

/**
 * Header de la landing: logo + CTA "Comenzar a grabar".
 * Con sesión → enlace a /record. Sin sesión → clic abre modal de Google y redirige a /record.
 */
export function LandingHeader() {
	const { user, loading } = useAuth();
	return (
		<header className="border-b border-border/50">
			<div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
				<span className="text-lg font-semibold tracking-tight">Voom</span>
				{loading ? (
					<span className="text-sm text-muted-foreground">Cargando…</span>
				) : user ? (
					<Link href="/record">
						<Button variant="orange" size="sm">
							Comenzar a grabar
						</Button>
					</Link>
				) : (
					<LandingAuthCTAHeader />
				)}
			</div>
		</header>
	);
}

function LandingAuthCTAHeader() {
	const { loginWithGoogle } = useAuth();
	const router = useRouter();
	const handleClick = async () => {
		try {
			await loginWithGoogle();
			router.push("/record");
		} catch (e) {
			console.error(e);
		}
	};

	return (
		<Button variant="orange" size="sm" onClick={handleClick}>
			Comenzar a grabar
		</Button>
	);
}
