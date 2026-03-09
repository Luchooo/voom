'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

const ctaClassNames = {
	default:
		'inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-background',
	sm: 'inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-background',
} as const;

/**
 * CTA "Comenzar a grabar video": con sesión → enlace a /record; sin sesión → clic abre modal de Google y redirige a /record.
 * variant="sm" para la sección de features (botón más compacto).
 */
export function LandingAuthCTA({ variant = 'default' }: { variant?: 'default' | 'sm' }) {
	const { user, loading, loginWithGoogle } = useAuth();
	const router = useRouter();

	const handleClick = useCallback(async () => {
		if (user) return;
		try {
			await loginWithGoogle();
			router.push('/record');
		} catch (e) {
			console.error('Google sign-in failed:', e);
		}
	}, [user, loginWithGoogle, router]);

	const className = ctaClassNames[variant];
	const iconClass = variant === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

	if (loading) {
		return (
			<div className={`${className} bg-muted text-muted-foreground`}>
				<span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
				Verificando sesión…
			</div>
		);
	}

	const ctaContent = (
		<>
			Comenzar a grabar video
			<svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
			</svg>
		</>
	);

	if (user) {
		return (
			<Link href="/record" className={className}>
				{ctaContent}
			</Link>
		);
	}

	return (
		<button type="button" onClick={handleClick} className={className}>
			{ctaContent}
		</button>
	);
}
