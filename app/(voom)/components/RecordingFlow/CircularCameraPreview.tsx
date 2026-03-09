"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CameraOverlayState,
  CameraOverlaySize,
} from "@voom/types/recorder";
import { CIRCLE_DIAMETER_DEFAULT, AVATAR_CIRCLE_DIAMETER } from "@voom/types/recorder";
import { getOverlayLabel } from "@voom/lib/overlaySize";

interface CircularCameraPreviewProps {
  stream: MediaStream | null;
  overlayRef: React.MutableRefObject<CameraOverlayState | null>;
  /** Valores iniciales (p. ej. desde localStorage) */
  initialPosition?: { x: number; y: number };
  initialSize?: CameraOverlaySize;
  /** Diámetro del círculo (100–600) cuando size es small o large */
  circleDiameterPx?: number;
  /** Si true, muestra la cámara en espejo */
  flipCamera?: boolean;
  /** Se llama al cambiar posición o tamaño para persistir */
  onStateChange?: (
    position: { x: number; y: number },
    size: CameraOverlaySize,
  ) => void;
  /** Se llama al elegir tamaño pequeño/grande para sincronizar con options */
  onCircleDiameterChange?: (diameterPx: number) => void;
  className?: string;
}

const DEFAULT_SIZE: CameraOverlaySize = "small";
const DEFAULT_POSITION = { x: 32, y: 320 };

function syncOverlayRef(
  ref: React.MutableRefObject<CameraOverlayState | null>,
  size: CameraOverlaySize,
  positionPx: { x: number; y: number },
  circleDiameterPx: number,
) {
  const isFullScreen = size === "fullscreen";
  const isAvatar = size === "avatar";
  const winW = typeof window !== "undefined" ? window.innerWidth : 1920;
  const winH = typeof window !== "undefined" ? window.innerHeight : 1080;
  const xRatio = winW > 0 ? Math.max(0, Math.min(1, positionPx.x / winW)) : 0;
  const yRatio = winH > 0 ? Math.max(0, Math.min(1, positionPx.y / winH)) : 0;
  ref.current = {
    xRatio,
    yRatio,
    circleDiameterPx: isFullScreen ? undefined : circleDiameterPx,
    isFullScreen,
    isAvatar,
  };
}

/** En preview, avatar usa el mismo diámetro que en la grabación. */
const PREVIEW_CIRCLE_AVATAR = AVATAR_CIRCLE_DIAMETER;

/** Cámara circular: 4 estados (tamaño configurable, pantalla completa, avatar). Arrastrable, hover revela opciones. */
export function CircularCameraPreview({
  stream,
  overlayRef,
  initialPosition,
  initialSize,
  circleDiameterPx = CIRCLE_DIAMETER_DEFAULT,
  flipCamera = true,
  onStateChange,
  onCircleDiameterChange,
  className = "",
}: CircularCameraPreviewProps) {
  const [size, setSize] = useState<CameraOverlaySize>(
    initialSize ?? DEFAULT_SIZE,
  );
  const [hover, setHover] = useState(false);
  const [position, setPosition] = useState(initialPosition ?? DEFAULT_POSITION);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);

  const circlePx =
    size === "avatar" ? PREVIEW_CIRCLE_AVATAR : circleDiameterPx;

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

  const effectiveDiameter =
    size === "fullscreen"
      ? CIRCLE_DIAMETER_DEFAULT
      : size === "avatar"
        ? PREVIEW_CIRCLE_AVATAR
        : circleDiameterPx;
  useEffect(() => {
    syncOverlayRef(overlayRef, size, position, effectiveDiameter);
  }, [size, position, overlayRef, effectiveDiameter]);

  const prevPositionRef = useRef(position);
  const prevSizeRef = useRef(size);
  useEffect(() => {
    if (prevPositionRef.current !== position || prevSizeRef.current !== size) {
      prevPositionRef.current = position;
      prevSizeRef.current = size;
      onStateChange?.(position, size);
    }
  }, [position, size, onStateChange]);

  useEffect(() => {
    if (typeof window === "undefined" || size === "fullscreen") return;
    const maxY = window.innerHeight - circlePx - 24;
    const id = requestAnimationFrame(() => {
      setPosition((p) => {
        if (p.y <= maxY) return p;
        return { x: p.x, y: maxY };
      });
    });
    return () => cancelAnimationFrame(id);
  }, [circlePx, size]);

  const setSizeAndSync = useCallback(
    (s: CameraOverlaySize) => {
      setSize(s);
      if (s === "small") onCircleDiameterChange?.(222);
      if (s === "large") onCircleDiameterChange?.(400);
    },
    [onCircleDiameterChange],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setDragging(true);
      dragStart.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    },
    [position],
  );

  useEffect(() => {
    if (!dragging) return;
    const winW = typeof window !== "undefined" ? window.innerWidth : 1920;
    const winH = typeof window !== "undefined" ? window.innerHeight : 1080;
    const onMove = (e: PointerEvent) => {
      setPosition(() => ({
        x: Math.max(
          0,
          Math.min(winW - circlePx, e.clientX - dragStart.current.x),
        ),
        y: Math.max(
          0,
          Math.min(winH - circlePx - 16, e.clientY - dragStart.current.y),
        ),
      }));
    };
    const onUp = () => setDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragging, circlePx]);

  const showVideo = stream && size !== "avatar";

  const sizeButtons = (
    <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card px-1.5 py-1.5 shadow-xl">
      <button
        type="button"
        onClick={() => setSizeAndSync("small")}
        title="Pequeño"
        className="flex h-9 w-9 items-center justify-center rounded text-card-foreground hover:bg-muted"
      >
        <SmallCircleIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setSizeAndSync("large")}
        title="Grande"
        className="flex h-9 w-9 items-center justify-center rounded text-card-foreground hover:bg-muted"
      >
        <LargeCircleIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => setSizeAndSync("fullscreen")}
        title="Pantalla completa"
        className="flex h-9 w-9 items-center justify-center rounded text-card-foreground hover:bg-muted"
      >
        <ExpandIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setSizeAndSync("avatar")}
        title="Avatar"
        className="flex h-9 w-9 items-center justify-center rounded text-card-foreground hover:bg-muted"
      >
        <AvatarIcon className="h-5 w-5" />
      </button>
    </div>
  );

  if (size === "fullscreen") {
    return (
      <div
        className="fixed inset-2 z-[5] overflow-hidden rounded-3xl border-4 border-border shadow-2xl ring-2 ring-foreground/20"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div className="h-full w-full overflow-hidden rounded-[calc(1rem-2px)]">
          {showVideo ? (
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              style={{ transform: flipCamera ? "scaleX(-1)" : "none" }}
              muted
              playsInline
            />
          ) : null}
        </div>
        {hover && (
          <>
            <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
              {sizeButtons}
            </div>
            <span className="absolute bottom-14 left-1/2 z-10 -translate-x-1/2 rounded-full bg-card border border-border px-2 py-0.5 text-xs font-medium text-card-foreground">
              {getOverlayLabel(size)}
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={`absolute flex flex-col items-center gap-2 ${className}`}
      style={{ left: position.x, top: position.y }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative">
        <div
          className={`relative overflow-hidden rounded-full border-4 border-border shadow-2xl ring-2 ring-foreground/20 transition-[width,height] duration-200 hover:shadow-orange-500/20 ${
            dragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{ width: circlePx, height: circlePx }}
          onPointerDown={handlePointerDown}
        >
          {showVideo ? (
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              style={{ transform: flipCamera ? "scaleX(-1)" : "none" }}
              muted
              playsInline
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <AvatarIcon className="h-1/3 w-1/3 text-muted-foreground" />
            </div>
          )}
        </div>
        {hover && (
          <div className="absolute -bottom-1 left-1/2 z-10 -translate-x-1/2 translate-y-full">
            {sizeButtons}
          </div>
        )}
      </div>
      {hover && (
        <span className="rounded-full bg-card border border-border px-2 py-0.5 text-xs font-medium text-card-foreground">
          {getOverlayLabel(size)}
        </span>
      )}
    </div>
  );
}

function ExpandIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4"
      />
    </svg>
  );
}

/** Círculo pequeño (tamaño pequeño) */
function SmallCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="12" cy="12" r="5" />
    </svg>
  );
}

/** Círculo más grande (tamaño grande) */
function LargeCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

/** Silueta de persona (avatar) */
function AvatarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}
