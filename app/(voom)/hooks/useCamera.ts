'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface CameraConstraints {
	width: number;
	height: number;
	frameRate?: number;
}

const DEFAULT_CAMERA: CameraConstraints = { width: 640, height: 480 };
const LOW_CPU_CAMERA: CameraConstraints = {
	width: 320,
	height: 240,
	frameRate: 15,
};

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

/**
 * Hook para captura de cámara (getUserMedia video).
 * Con performanceMode usa resolución baja y frameRate limitado para PCs con pocos recursos.
 * deviceId opcional para elegir cámara concreta.
 */
function isDeviceNotFoundError(err: unknown): boolean {
	const msg = err instanceof Error ? err.message : '';
	const name = err instanceof DOMException ? err.name : '';
	return (
		name === 'NotFoundError' ||
		/requested device not found|device not found/i.test(msg)
	);
}

export function useCamera(
	enabled: boolean,
	performanceMode = false,
	deviceId?: string,
) {
	const streamRef = useRef<MediaStream | null>(null);
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [deviceNotFound, setDeviceNotFound] = useState(false);
	const [isActive, setIsActive] = useState(false);

	const constraints = performanceMode ? LOW_CPU_CAMERA : DEFAULT_CAMERA;

	const start = useCallback(async (): Promise<MediaStream | null> => {
		setError(null);
		setDeviceNotFound(false);
		try {
			const videoConstraints: MediaTrackConstraints = {
				width: { ideal: constraints.width },
				height: { ideal: constraints.height },
				facingMode: 'user',
				...(deviceId ? { deviceId: { exact: deviceId } } : {}),
			};
			if (constraints.frameRate != null) {
				videoConstraints.frameRate = { max: constraints.frameRate };
			}
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
	}, [constraints.width, constraints.height, constraints.frameRate, deviceId]);

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
