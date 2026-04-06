'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { Skeleton } from '../ui/skeleton';

const ctaClassNames = {
	default:
		'inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-background',
	sm: 'inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-background',
} as const;

const skeletonSizes = {
	default: 'h-14 w-[min(100%,20rem)] rounded-full',
	sm: 'h-11 w-52 rounded-full',
} as const;

/**
 * Con sesión → enlace a /record con copy actual.
 * Sin sesión → “Continuar con Google”, icono de Google y mismo flujo de login.
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
	const iconClass =
		variant === 'sm'
			? 'h-5 w-5 shrink-0 text-white'
			: 'h-6 w-6 shrink-0 text-white';
	const arrowClass = variant === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

	if (loading) {
		return (
			<Skeleton
				className={skeletonSizes[variant]}
				aria-busy="true"
				aria-label="Cargando opciones de acceso"
			/>
		);
	}

	const loggedInContent = (
		<>
			Comenzar a grabar video
			<svg className={arrowClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
			</svg>
		</>
	);

	const googleCtaLabel = 'Continuar con Google';
	const googleAriaLabel =
		'Iniciar sesión con Google para comenzar a grabar video';

	const loggedOutContent = (
		<>
			<FaGoogle className={iconClass} aria-hidden />
			{googleCtaLabel}
		</>
	);

	if (user) {
		return (
			<Link href="/record" className={className}>
				{loggedInContent}
			</Link>
		);
	}

	return (
		<button
			type="button"
			onClick={handleClick}
			className={className}
			aria-label={googleAriaLabel}
		>
			{loggedOutContent}
		</button>
	);
}
