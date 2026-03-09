"use client";

import { RecordingFlow } from "@voom/components/RecordingFlow";

/**
 * Página principal del feature (voom): flujo de pre-grabación por defecto.
 * Overlay gris, cámara circular, card de dispositivos y countdown antes de grabar.
 */
export function RecorderPage({ showMp4Option = false }: { showMp4Option?: boolean }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <RecordingFlow showMp4Option={showMp4Option} />
    </main>
  );
}
