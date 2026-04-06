"use client";

import { ReactNode } from "react";

interface RecordingOverlayProps {
  children: ReactNode;
  className?: string;
}

/**
 * Overlay gris semitransparente con blur (grabando, preview, trim).
 * En desktop alinea el borde izquierdo con el sidebar: ancho completo (var) expandido,
 * 3.5rem (left-14) colapsado — igual que SidebarInset — para no dejar una franja sin velo.
 */
export function RecordingOverlay({ children, className = "" }: RecordingOverlayProps) {
  return (
    <div
      className={`fixed inset-y-0 right-0 left-0 z-50 flex min-h-0 flex-col overflow-hidden bg-black/20 backdrop-blur-sm transition-[opacity,left] duration-200 ease-linear dark:bg-black/50 md:left-(--sidebar-width,0) group-data-[state=collapsed]/sidebar:md:left-14 ${className}`}
      aria-modal="true"
      role="dialog"
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
