/**
 * Utilidades para combinar y gestionar MediaStreams.
 * Usamos canvas para unificar pantalla + cámara en un solo video track
 * y mezclar con audio del micrófono.
 */

import type { CameraOverlayState } from "@voom/types/recorder";

export type { CameraOverlayState };

export interface CombineScreenOptions {
  /** FPS del stream de salida (30, 60, 120). Por defecto 60. Reducir a 30 en PCs lentos. */
  fps?: number;
  /** Ref al estado del overlay (usado si no se pasa overlayState). */
  overlayRef?: { current: CameraOverlayState | null };
  /** Snapshot del overlay al iniciar la grabación; tiene prioridad sobre overlayRef. Evita que el ref quede desactualizado al desmontar la preview. */
  overlayState?: CameraOverlayState | null;
  /** Si true, dibuja la cámara volteada (espejo). */
  flipCamera?: boolean;
  /**
   * Imagen de perfil precargada (p. ej. foto de Google) para modo avatar en el canvas.
   * Si falta o falla la carga, se usa el placeholder.
   */
  avatarProfileImage?: HTMLImageElement | null;
}

/**
 * Precarga una URL de foto de perfil para dibujarla en canvas (CORS anonymous).
 * Si el servidor no permite CORS, devuelve null y se usará el placeholder en grabación.
 */
export function preloadAvatarProfileImage(
  url: string
): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    const finish = () => {
      if (img.naturalWidth > 0) resolve(img);
      else resolve(null);
    };
    img.onload = finish;
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Ruta de rectángulo con esquinas redondeadas (para recortar la cámara fullscreen).
 */
function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
): void {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * SVG del icono IoPersonOutline (react-icons/io5) como string para dibujar en canvas.
 * viewBox 0 0 512 512, stroke blanco, mismo asset que la UI.
 */
const AVATAR_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="white" stroke-width="32" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M344 144c-3.92 52.87-44 96-88 96s-84.15-43.12-88-96c-4-55 35-96 88-96s92 42 88 96z"/>' +
  '<path stroke-miterlimit="10" d="M256 304c-87 0-175.3 48-191.64 138.6C62.39 453.52 68.57 464 80 464h352c11.44 0 17.62-10.48 15.65-21.4C431.3 352 343 304 256 304z"/>' +
  "</svg>";

let avatarIconImage: HTMLImageElement | null = null;

function getAvatarIconImage(): HTMLImageElement | null {
  if (typeof document === "undefined") return null;
  if (avatarIconImage) return avatarIconImage.complete ? avatarIconImage : null;
  avatarIconImage = new Image();
  avatarIconImage.src =
    "data:image/svg+xml," + encodeURIComponent(AVATAR_ICON_SVG);
  return null;
}

/**
 * Dibuja el icono de avatar (IoPersonOutline de react-icons) centrado en el círculo (x, y, d).
 * Usa la misma silueta que la UI; si la imagen SVG aún no ha cargado, dibuja un fallback en canvas.
 */
function drawAvatarPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  d: number
): void {
  const cx = x + d / 2;
  const cy = y + d / 2;
  const r = d / 2 - 4;
  ctx.save();
  ctx.fillStyle = "rgba(40, 40, 40, 0.95)";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
  ctx.lineWidth = Math.max(2, d / 80);
  ctx.stroke();
  const img = getAvatarIconImage();
  if (img && img.complete && img.naturalWidth > 0) {
    const size = d * 0.52;
    ctx.drawImage(
      img,
      cx - size / 2,
      cy - size / 2,
      size,
      size
    );
  } else {
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    const scale = (d * 0.5) / 24;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-12, -12);
    ctx.beginPath();
    ctx.arc(12, 8, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, 12.5);
    ctx.lineTo(5, 19);
    ctx.lineTo(5, 21);
    ctx.lineTo(19, 21);
    ctx.lineTo(19, 19);
    ctx.lineTo(16, 12.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Foto de perfil en círculo (object-cover) o placeholder si no hay imagen válida. */
function drawAvatarProfileOrPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  profileImg: HTMLImageElement | null | undefined
): void {
  const cx = x + w / 2;
  const cy = y + w / 2;
  const r = w / 2;
  if (profileImg && profileImg.complete && profileImg.naturalWidth > 0) {
    const iw = profileImg.naturalWidth;
    const ih = profileImg.naturalHeight;
    const scale = Math.max(w / iw, w / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = x + (w - dw) / 2;
    const dy = y + (w - dh) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.clip();
    ctx.drawImage(profileImg, 0, 0, iw, ih, dx, dy, dw, dh);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = Math.max(2, w / 80);
    ctx.stroke();
    ctx.restore();
  } else {
    drawAvatarPlaceholder(ctx, x, y, w);
  }
}

/**
 * Combina el stream de pantalla con el de cámara (opcional) o placeholder (avatar).
 * Si no hay cámara ni overlay con avatar, devuelve solo el stream de pantalla.
 */
export function combineScreenAndCameraStreams(
  screenStream: MediaStream,
  cameraStream: MediaStream | null,
  options: CombineScreenOptions = {}
): MediaStream {
  const targetFps = Math.min(120, Math.max(1, options.fps ?? 30));
  const initialOverlay = options.overlayState ?? options.overlayRef?.current;
  const needsCanvas =
    (cameraStream && cameraStream.getVideoTracks().length > 0) ||
    (initialOverlay?.isAvatar === true);

  if (!needsCanvas) {
    return screenStream.clone();
  }

  if (initialOverlay?.isAvatar) {
    getAvatarIconImage();
  }

  const screenTrack = screenStream.getVideoTracks()[0];
  const { width, height } = screenTrack.getSettings();

  const canvas = document.createElement("canvas");
  canvas.width = width ?? 1920;
  canvas.height = height ?? 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) return screenStream.clone();

  const screenVideo = document.createElement("video");
  screenVideo.srcObject = screenStream;
  screenVideo.muted = true;
  screenVideo.playsInline = true;
  screenVideo.play().catch(() => {});
  screenVideo.onloadedmetadata = () => {
    const vw = screenVideo.videoWidth;
    const vh = screenVideo.videoHeight;
    if (vw > 0 && vh > 0) {
      canvas.width = vw;
      canvas.height = vh;
    }
  };

  const cameraVideo = document.createElement("video");
  if (cameraStream) {
    cameraVideo.srcObject = cameraStream;
    cameraVideo.play();
    cameraVideo.muted = true;
    cameraVideo.playsInline = true;
  }

  const overlayRef = options.overlayRef;
  const overlayStateSnapshot = options.overlayState ?? null;
  const flipCamera = options.flipCamera !== false;
  const avatarProfileImage = options.avatarProfileImage ?? null;
  const drawFrame = () => {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    if (!W || !H) return;
    if (screenVideo.readyState < 2) return;
    ctx.drawImage(screenVideo, 0, 0, W, H);

    const overlay = overlayStateSnapshot ?? overlayRef?.current;
    if (!overlay) return;

    if (overlay.isFullScreen) {
      if (cameraVideo.srcObject && cameraVideo.readyState >= 1) {
        const margin = Math.min(80, Math.min(W, H) * 0.08);
        const x = margin;
        const y = margin;
        const w = W - 2 * margin;
        const h = H - 2 * margin;
        const radius = Math.min(48, Math.min(w, h) * 0.05);
        ctx.save();
        roundRectPath(ctx, x, y, w, h, radius);
        ctx.clip();
        if (flipCamera) {
          ctx.translate(x + w, y);
          ctx.scale(-1, 1);
          ctx.drawImage(cameraVideo, x, y, w, h);
        } else {
          ctx.drawImage(cameraVideo, x, y, w, h);
        }
        ctx.restore();
      }
      return;
    }

    const diameter = overlay.circleDiameterPx ?? 222;
    const w = Math.min(diameter, W, H);
    const h = w;
    const x = Math.round(overlay.xRatio * (W - w));
    const y = Math.round(overlay.yRatio * (H - h));
    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = w / 2;

    if (overlay.isAvatar) {
      drawAvatarProfileOrPlaceholder(ctx, x, y, w, avatarProfileImage);
      return;
    }

    if (cameraVideo.srcObject && (cameraVideo.readyState >= 2 || cameraVideo.readyState >= 1)) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.clip();
      if (flipCamera) {
        ctx.translate(cx, cy);
        ctx.scale(-1, 1);
        ctx.translate(-cx, -cy);
      }
      ctx.drawImage(cameraVideo, x, y, w, h);
      ctx.restore();
    }
  };

  let rafId: number | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const startDrawLoop = () => {
    if (document.visibilityState === "visible") {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      const loop = () => {
        drawFrame();
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    } else {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (intervalId === null) {
        intervalId = setInterval(drawFrame, Math.round(1000 / targetFps));
      }
    }
  };

  const stopDrawLoop = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  document.addEventListener("visibilitychange", startDrawLoop);
  screenVideo.onloadedmetadata = () => drawFrame();
  startDrawLoop();

  const outputStream = canvas.captureStream(targetFps);
  outputStream.getVideoTracks().forEach((track) => {
    const origStop = track.stop.bind(track);
    track.stop = () => {
      document.removeEventListener("visibilitychange", startDrawLoop);
      stopDrawLoop();
      origStop();
    };
  });
  return outputStream;
}

/**
 * Añade las pistas de audio de `audioStream` al `videoStream`.
 * No modifica los streams originales; devuelve un nuevo MediaStream.
 */
export function mergeAudioIntoStream(
  videoStream: MediaStream,
  audioStream: MediaStream | null
): MediaStream {
  const result = new MediaStream();
  videoStream.getVideoTracks().forEach((t) => result.addTrack(t));
  if (audioStream) {
    audioStream.getAudioTracks().forEach((t) => result.addTrack(t));
  }
  return result;
}

/**
 * Mezcla el audio de varios MediaStreams en uno solo (Web Audio API).
 * Útil para grabar micrófono + sonido de pestaña/pantalla a la vez.
 * Devuelve el stream mezclado, una función close() y una promesa ready:
 * hay que await ready antes de empezar a grabar para evitar glitches al inicio.
 */
export function mixAudioStreams(streams: MediaStream[]): {
  stream: MediaStream;
  close: () => void;
  ready: Promise<void>;
} {
  const audioStreams = streams.filter((s) => s.getAudioTracks().length > 0);
  if (audioStreams.length === 0) {
    return { stream: new MediaStream(), close: () => {}, ready: Promise.resolve() };
  }
  if (audioStreams.length === 1) {
    const s = audioStreams[0];
    const mixed = new MediaStream(s.getAudioTracks());
    return { stream: mixed, close: () => {}, ready: Promise.resolve() };
  }

  const ctx = new AudioContext();
  const destination = ctx.createMediaStreamDestination();

  for (const stream of audioStreams) {
    const source = ctx.createMediaStreamSource(stream);
    source.connect(destination);
  }

  const ready =
    ctx.state === "running"
      ? Promise.resolve()
      : ctx.resume().then(() => undefined);

  return {
    stream: destination.stream,
    close: () => {
      ctx.close().catch(() => {});
    },
    ready,
  };
}

/**
 * Detiene todas las pistas de un stream para liberar recursos.
 */
export function stopAllTracks(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}
