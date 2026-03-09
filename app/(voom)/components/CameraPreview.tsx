"use client";

import { useEffect, useRef } from "react";

interface CameraPreviewProps {
  stream: MediaStream | null;
  className?: string;
  muted?: boolean;
}

/**
 * Muestra el preview de la cámara cuando está activa.
 * Usa un elemento <video> con ref para asignar srcObject.
 */
export function CameraPreview({ stream, className = "", muted = true }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    if (stream) {
      video.play().catch(() => {});
    }
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  if (!stream) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed bg-muted text-muted-foreground ${className}`}
      >
        <span className="text-sm">Cámara desactivada</span>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      className={`rounded-lg object-cover mirror ${className}`}
      muted={muted}
      playsInline
      style={{ transform: "scaleX(-1)" }}
    />
  );
}
