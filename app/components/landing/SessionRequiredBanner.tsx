'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Tras redirección desde /record sin sesión (?sessionRequired=1), muestra aviso y limpia la URL.
 */
export function SessionRequiredBanner() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (searchParams.get('sessionRequired') !== '1') return;
		void router.replace('/', { scroll: false });
		const id = requestAnimationFrame(() => setVisible(true));
		return () => cancelAnimationFrame(id);
	}, [searchParams, router]);

	if (!visible) return null;

	return (
		<div
			role="alert"
			className="border-b border-orange-500/40 bg-orange-500/15 px-4 py-3 text-center text-sm text-foreground"
		>
			<p className="font-medium">
				Necesitas iniciar sesión con Google para usar la grabación.
			</p>
			<button
				type="button"
				onClick={() => setVisible(false)}
				className="mt-2 text-xs text-muted-foreground underline hover:text-foreground"
			>
				Cerrar
			</button>
		</div>
	);
}
