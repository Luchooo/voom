"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaGoogle } from "react-icons/fa";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

/**
 * Header de la landing: logo + CTA según sesión (Google si no hay usuario).
 */
export function LandingHeader() {
	const { user, loading } = useAuth();
	return (
		<header className="border-b border-border/50">
			<div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
				<span className="text-lg font-semibold tracking-tight">Voom</span>
				{loading ? (
					<Skeleton
						className="h-9 w-44 rounded-md"
						aria-busy="true"
						aria-label="Cargando opciones de acceso"
					/>
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
		<Button
			variant="orange"
			size="sm"
			onClick={handleClick}
			className="gap-2"
			aria-label="Iniciar sesión con Google para comenzar a grabar"
		>
			<FaGoogle className="h-5 w-5 shrink-0 text-white" aria-hidden />
			Continuar con Google
		</Button>
	);
}
