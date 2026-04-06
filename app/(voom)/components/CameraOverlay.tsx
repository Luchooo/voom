"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import type { CameraOverlayState, CameraOverlaySize } from "@voom/types/recorder";
import {
  AVATAR_CIRCLE_DIAMETER,
  CIRCLE_DIAMETER_DEFAULT,
  CIRCLE_DIAMETER_PX,
} from "@voom/types/recorder";
import { getOverlayLabel } from "@voom/lib/overlaySize";

interface CameraOverlayProps {
  stream: MediaStream | null;
  overlayRef: React.MutableRefObject<CameraOverlayState | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
  /** Foto de perfil (p. ej. Google) en modo avatar */
  avatarPhotoUrl?: string | null;
  /** Notifica cambios de tamaño (p. ej. avatar) para detener/reanudar el track de cámara en el padre */
  onOverlaySizeChange?: (size: CameraOverlaySize) => void;
  /** Diámetro lógico del círculo (igual que en la grabación; 100–600). */
  circleDiameterPx?: number;
  /** Al pulsar Pequeño / Grande / Avatar: sincronizar diámetro con el padre */
  onCircleDiameterChange?: (diameterPx: number) => void;
}

const DEFAULT_LEFT = 78;
const DEFAULT_TOP = 2;
const DEFAULT_SIZE: CameraOverlaySize = "small";

/** Ancho % del preview en la card (solo para esta UI) */
const PREVIEW_WIDTH_PERCENT: Record<CameraOverlaySize, number> = {
  small: 12,
  large: 22,
  fullscreen: 100,
  avatar: 12,
};

function syncOverlayRef(
  ref: React.MutableRefObject<CameraOverlayState | null>,
  leftPercent: number,
  topPercent: number,
  size: CameraOverlaySize,
  circleDiameterPx: number
) {
  const isFullScreen = size === "fullscreen";
  const isAvatar = size === "avatar";
  ref.current = {
    xRatio: leftPercent / 100,
    yRatio: topPercent / 100,
    circleDiameterPx: isFullScreen ? undefined : circleDiameterPx,
    isFullScreen,
    isAvatar,
  };
}

function layoutPercents(
  size: CameraOverlaySize,
  previewW: number,
  previewH: number,
  circleDiameterPx: number
): { widthPercent: number; heightPercent: number; aspectRatio: string } {
  if (size === "fullscreen") {
    return { widthPercent: 100, heightPercent: 100, aspectRatio: "16/9" };
  }
  const winW = typeof window !== "undefined" ? window.innerWidth : 1920;
  if (size === "avatar" && previewW > 0 && winW > 0) {
    const dPx = Math.round(circleDiameterPx * (previewW / winW));
    const d = Math.max(32, Math.min(previewW, dPx));
    const wPct = Math.min(95, (d / previewW) * 100);
    const hPct =
      previewH > 0 ? Math.min(95, (d / previewH) * 100) : wPct;
    return { widthPercent: wPct, heightPercent: hPct, aspectRatio: "1" };
  }
  const widthPercent = PREVIEW_WIDTH_PERCENT[size];
  return {
    widthPercent,
    heightPercent: widthPercent * (9 / 16),
    aspectRatio: "16/9",
  };
}

export function CameraOverlay({
  stream,
  overlayRef,
  containerRef,
  className = "",
  avatarPhotoUrl = null,
  onOverlaySizeChange,
  circleDiameterPx = CIRCLE_DIAMETER_DEFAULT,
  onCircleDiameterChange,
}: CameraOverlayProps) {
  const [position, setPosition] = useState({ left: DEFAULT_LEFT, top: DEFAULT_TOP });
  const [size, setSize] = useState<CameraOverlaySize>(DEFAULT_SIZE);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, left: 0, top: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const [previewBox, setPreviewBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setPreviewBox({ w: el.offsetWidth, h: el.offsetHeight });
    });
    ro.observe(el);
    setPreviewBox({ w: el.offsetWidth, h: el.offsetHeight });
    return () => ro.disconnect();
  }, [containerRef]);

  useEffect(() => {
    if (!stream || !videoRef.current) return;
    if (size === "avatar") return;
    const video = videoRef.current;
    video.srcObject = stream;
    video.play().catch(() => {});
    return () => {
      video.srcObject = null;
    };
  }, [stream, size]);

  useEffect(() => {
    syncOverlayRef(overlayRef, position.left, position.top, size, circleDiameterPx);
  }, [position, size, overlayRef, circleDiameterPx]);

  useEffect(() => {
    onOverlaySizeChange?.(size);
  }, [size, onOverlaySizeChange]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (size === "fullscreen") return;
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        left: position.left,
        top: position.top,
      };
    },
    [position, size]
  );

  useEffect(() => {
    if (!isDragging) return;
    const container = containerRef.current;
    const onMove = (e: MouseEvent) => {
      const cw = container?.offsetWidth ?? 1;
      const ch = container?.offsetHeight ?? 1;
      const dxPercent = ((e.clientX - dragStart.current.x) / cw) * 100;
      const dyPercent = ((e.clientY - dragStart.current.y) / ch) * 100;
      const { widthPercent, heightPercent } = layoutPercents(
        size,
        cw,
        ch,
        circleDiameterPx
      );
      setPosition({
        left: Math.max(0, Math.min(100 - widthPercent, dragStart.current.left + dxPercent)),
        top: Math.max(0, Math.min(100 - heightPercent, dragStart.current.top + dyPercent)),
      });
    };
    const onUp = () => setIsDragging(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, containerRef, size, circleDiameterPx]);

  const setSizeAndPosition = useCallback(
    (newSize: CameraOverlaySize) => {
      setSize(newSize);
      if (newSize === "fullscreen") {
        setPosition({ left: 0, top: 0 });
      }
      if (newSize === "small") onCircleDiameterChange?.(CIRCLE_DIAMETER_PX.small);
      else if (newSize === "large") onCircleDiameterChange?.(CIRCLE_DIAMETER_PX.large);
      else if (newSize === "avatar") onCircleDiameterChange?.(AVATAR_CIRCLE_DIAMETER);
    },
    [onCircleDiameterChange]
  );

  if (!stream && size !== "avatar") return null;

  const { widthPercent, aspectRatio } = layoutPercents(
    size,
    previewBox.w,
    previewBox.h,
    circleDiameterPx
  );
  const isFullScreen = size === "fullscreen";
  const showVideo = stream && size !== "avatar";

  return (
    <Card
      className={`absolute z-10 overflow-hidden border-2 bg-black/90 shadow-lg ${isFullScreen ? "inset-0 w-full h-full" : ""} ${className}`}
      style={
        isFullScreen
          ? undefined
          : {
              left: `${position.left}%`,
              top: `${position.top}%`,
              width: `${widthPercent}%`,
              aspectRatio,
            }
      }
    >
      <CardContent className="p-0 flex flex-col h-full">
        <div
          onMouseDown={handleMouseDown}
          className={`relative flex-1 flex items-center justify-center bg-black ${isDragging ? "cursor-grabbing" : size === "fullscreen" ? "" : "cursor-grab"}`}
        >
          {showVideo ? (
            <video
              ref={videoRef}
              className="h-full w-full object-cover mirror"
              style={{ transform: "scaleX(-1)" }}
              muted
              playsInline
            />
          ) : size === "avatar" && avatarPhotoUrl ? (
            <div className="relative mx-auto aspect-square h-full w-full min-h-0 min-w-0 overflow-hidden rounded-full">
              <Image
                src={avatarPhotoUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 120px, 200px"
                priority
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-800">
              <CameraIcon className="h-1/3 w-1/3 text-white/80" />
            </div>
          )}
          {!isFullScreen && (
            <span className="absolute top-1 left-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
              {getOverlayLabel(size)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-center gap-1 border-t border-white/20 bg-black/70 p-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={() => setSizeAndPosition("small")}
            title="Pequeño (222px)"
          >
            <span className="text-xs font-bold">222</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={() => setSizeAndPosition("large")}
            title="Grande (400px)"
          >
            <span className="text-xs font-bold">400</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={() => setSizeAndPosition("fullscreen")}
            title="Pantalla completa"
          >
            <ExpandIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={() => setSizeAndPosition("avatar")}
            title="Avatar (icono)"
          >
            <CameraIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ExpandIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 17v2a2 2 0 01-2 2H7a2 2 0 01-2-2v-2" />
    </svg>
  );
}
