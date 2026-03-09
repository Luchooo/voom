'use client';

import { Button } from '../../../components/ui/button';

interface WelcomeStepProps {
	onStart: () => void;
}

/** Paso inicial: botón central "Grabar" como punto de entrada */
export function WelcomeStep({ onStart }: WelcomeStepProps) {
	return (
		<div className="flex min-h-full items-center justify-center p-8">
			<Button
				type="button"
				onClick={onStart}
				variant="orange"
				size="lg"
				className="h-14 rounded-full px-10 text-lg font-semibold shadow-lg focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-background"
			>
				Grabar
			</Button>
		</div>
	);
}
