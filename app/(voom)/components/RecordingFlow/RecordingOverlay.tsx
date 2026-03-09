"use client";

import { ReactNode } from "react";

interface RecordingOverlayProps {
  children: ReactNode;
  className?: string;
}

/** Overlay gris semitransparente que cubre la pantalla (fase previa a grabar) */
export function RecordingOverlay({ children, className = "" }: RecordingOverlayProps) {
  return (
    <div
      className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity ${className}`}
      aria-modal="true"
      role="dialog"
    >
      {children}
    </div>
  );
}
