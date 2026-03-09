"use client";

import { ReactNode } from "react";

interface RecordingOverlayProps {
  children: ReactNode;
  className?: string;
}

/**
 * Overlay gris semitransparente con blur (grabando, preview, trim).
 * Usa left-[var(--sidebar-width)] cuando está dentro de SidebarProvider para no tapar el sidebar.
 */
export function RecordingOverlay({ children, className = "" }: RecordingOverlayProps) {
  return (
    <div
      className={`fixed inset-y-0 right-0 left-0 z-50 bg-black/20 backdrop-blur-sm transition-opacity dark:bg-black/50 md:left-[var(--sidebar-width,0)] ${className}`}
      aria-modal="true"
      role="dialog"
    >
      {children}
    </div>
  );
}
