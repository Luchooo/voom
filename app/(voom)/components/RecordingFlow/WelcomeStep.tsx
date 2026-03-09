"use client";

interface WelcomeStepProps {
  onStart: () => void;
}

/** Paso inicial: botón central "Grabar" como punto de entrada */
export function WelcomeStep({ onStart }: WelcomeStepProps) {
  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <button
        type="button"
        onClick={onStart}
        className="h-14 rounded-full bg-orange-600 px-10 text-lg font-semibold text-white shadow-lg transition-all hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-background"
      >
        Grabar
      </button>
    </div>
  );
}
