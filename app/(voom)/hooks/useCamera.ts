'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getOptimalCameraConstraints } from '@voom/lib/camera';

/** Convierte errores de getUserMedia a mensajes en español. */
function cameraErrorToMessage(err: unknown): string {
	const msg = err instanceof Error ? err.message : '';
	const name = err instanceof DOMException ? err.name : '';
	if (
		name === 'NotFoundError' ||
		/requested device not found|device not found/i.test(msg)
	)
		return 'No se encontró ninguna cámara. Conecta una cámara o desactiva la opción de cámara.';
	if (
		name === 'NotAllowedError' ||
		/permission denied|Permission denied/i.test(msg)
	)
		return 'Se ha denegado el acceso a la cámara. Revisa los permisos del navegador.';
	if (name === 'NotReadableError' || /could not start|not readable/i.test(msg))
		return 'No se pudo usar la cámara (puede estar en uso por otra aplicación).';
	if (msg) return msg;
	return 'Error al acceder a la cámara.';
}

/** @deprecated Usar getOptimalCameraConstraints de @voom/lib/camera. */
export interface CameraConstraints {
	width: number;
	height: number;
	frameRate?: number;
}

function isDeviceNotFoundError(err: unknown): boolean {
	const msg = err instanceof Error ? err.message : '';
	const name = err instanceof DOMException ? err.name : '';
	return (
		name === 'NotFoundError' ||
		/requested device not found|device not found/i.test(msg)
	);
}

/**
 * Hook para captura de cámara (getUserMedia video).
 * Usa el Camera Performance Engine: adapta resolución y FPS al hardware,
 * al tamaño en UI (circleDiameterPx) y a la cámara seleccionada.
 *
 * @param enabled - Si la cámara debe estar activa.
 * @param performanceMode - Si true, fuerza perfil "low" (360p, 15 fps).
 * @param deviceId - deviceId de la cámara elegida por el usuario (enumerateDevices).
 * @param uiSizePx - Diámetro del círculo en la UI (ej. 120, 222); evita pedir 1080p para un círculo pequeño.
 */
export function useCamera(
	enabled: boolean,
	performanceMode = false,
	deviceId?: string,
	uiSizePx?: number,
) {
	const streamRef = useRef<MediaStream | null>(null);
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [deviceNotFound, setDeviceNotFound] = useState(false);
	const [isActive, setIsActive] = useState(false);

	const start = useCallback(async (): Promise<MediaStream | null> => {
		setError(null);
		setDeviceNotFound(false);
		try {
			const videoConstraints = getOptimalCameraConstraints({
				forcePerformanceMode: performanceMode,
				uiSizePx,
				deviceId,
			});
			const mediaStream = await navigator.mediaDevices.getUserMedia({
				video: videoConstraints,
				audio: false,
			});
			streamRef.current = mediaStream;
			setStream(mediaStream);
			setIsActive(true);
			return mediaStream;
		} catch (err) {
			const message = cameraErrorToMessage(err);
			setError(message);
			setDeviceNotFound(isDeviceNotFoundError(err));
			return null;
		}
	}, [performanceMode, uiSizePx, deviceId]);

	const stop = useCallback(() => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((t) => t.stop());
			streamRef.current = null;
		}
		setStream(null);
		setIsActive(false);
		setError(null);
		// No borrar deviceNotFound aquí: si no hay cámara debe seguir true para mantener el switch deshabilitado.
	}, []);

	useEffect(() => {
		let cancelled = false;
		const timeoutId = setTimeout(() => {
			if (cancelled) return;
			if (enabled) {
				start();
			} else {
				stop();
			}
		}, 0);
		return () => {
			cancelled = true;
			clearTimeout(timeoutId);
			stop();
		};
	}, [enabled, start, stop, deviceId]);

	return { start, stop, isActive, error, deviceNotFound, streamRef, stream };
}
