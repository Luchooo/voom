"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import type { CameraOverlayState, CameraOverlaySize } from "@voom/types/recorder";
import { CIRCLE_DIAMETER_PX } from "@voom/types/recorder";
import { getOverlayLabel } from "@voom/lib/overlaySize";

interface CameraOverlayProps {
  stream: MediaStream | null;
  overlayRef: React.MutableRefObject<CameraOverlayState | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
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
  size: CameraOverlaySize
) {
  const isFullScreen = size === "fullscreen";
  const isAvatar = size === "avatar";
  const circleDiameterPx =
    size === "small"
      ? CIRCLE_DIAMETER_PX.small
      : size === "large"
        ? CIRCLE_DIAMETER_PX.large
        : 222;
  ref.current = {
    xRatio: leftPercent / 100,
    yRatio: topPercent / 100,
    circleDiameterPx: isFullScreen ? undefined : circleDiameterPx,
    isFullScreen,
    isAvatar,
  };
}

export function CameraOverlay({
  stream,
  overlayRef,
  containerRef,
  className = "",
}: CameraOverlayProps) {
  const [position, setPosition] = useState({ left: DEFAULT_LEFT, top: DEFAULT_TOP });
  const [size, setSize] = useState<CameraOverlaySize>(DEFAULT_SIZE);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, left: 0, top: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!stream || !videoRef.current) return;
    if (size === "avatar") return;
    videoRef.current.srcObject = stream;
    videoRef.current.play().catch(() => {});
    return () => {
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [stream, size]);

  useEffect(() => {
    syncOverlayRef(overlayRef, position.left, position.top, size);
  }, [position, size, overlayRef]);

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
      const widthPercent = PREVIEW_WIDTH_PERCENT[size];
      const heightPercent = size === "fullscreen" ? 100 : widthPercent * (9 / 16);
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
  }, [isDragging, containerRef, size]);

  const setSizeAndPosition = useCallback((newSize: CameraOverlaySize) => {
    setSize(newSize);
    if (newSize === "fullscreen") {
      setPosition({ left: 0, top: 0 });
    }
  }, []);

  if (!stream && size !== "avatar") return null;

  const widthPercent = PREVIEW_WIDTH_PERCENT[size];
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
              aspectRatio: "16/9",
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
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={() => setSizeAndPosition("small")}
            title="Pequeño (222px)"
          >
            <span className="text-xs font-bold">222</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={() => setSizeAndPosition("large")}
            title="Grande (400px)"
          >
            <span className="text-xs font-bold">400</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={() => setSizeAndPosition("fullscreen")}
            title="Pantalla completa"
          >
            <ExpandIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20"
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
