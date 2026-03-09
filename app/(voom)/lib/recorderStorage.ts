import type { RecorderOptions } from "@voom/types/recorder";
import type { CameraOverlaySize } from "@voom/types/recorder";

const KEY_OPTIONS = "voom-recorder-options";
const KEY_CAMERA_OVERLAY = "voom-camera-overlay";
const KEY_CAMERA_UNAVAILABLE = "voom-camera-unavailable";

export function getCameraUnavailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(KEY_CAMERA_UNAVAILABLE) === "1";
  } catch {
    return false;
  }
}

export function setCameraUnavailable(unavailable: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (unavailable) localStorage.setItem(KEY_CAMERA_UNAVAILABLE, "1");
    else localStorage.removeItem(KEY_CAMERA_UNAVAILABLE);
  } catch {
    // ignore
  }
}

export interface StoredCameraOverlay {
  position: { x: number; y: number };
  size: CameraOverlaySize;
}

export function loadRecorderOptions(): RecorderOptions | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY_OPTIONS);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RecorderOptions;
    if (
      typeof parsed.screen === "boolean" &&
      typeof parsed.microphone === "boolean" &&
      typeof parsed.camera === "boolean" &&
      ["720p", "1080p", "native"].includes(parsed.resolution) &&
      [30, 60, 120].includes(parsed.frameRate)
    ) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveRecorderOptions(options: RecorderOptions): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY_OPTIONS, JSON.stringify(options));
  } catch {
    // ignore
  }
}

export function loadCameraOverlay(): StoredCameraOverlay | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY_CAMERA_OVERLAY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCameraOverlay;
    const validSize = ["small", "large", "fullscreen", "avatar"].includes(parsed.size);
    if (
      validSize &&
      typeof parsed.position?.x === "number" &&
      typeof parsed.position?.y === "number"
    ) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveCameraOverlay(data: StoredCameraOverlay): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY_CAMERA_OVERLAY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function clearRecorderStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY_OPTIONS);
    localStorage.removeItem(KEY_CAMERA_OVERLAY);
    localStorage.removeItem(KEY_CAMERA_UNAVAILABLE);
  } catch {
    // ignore
  }
}
