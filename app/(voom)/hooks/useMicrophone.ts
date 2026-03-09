'use client';

import { useCallback, useRef, useState } from 'react';

/** Convierte errores de getUserMedia (audio) a mensajes en español. */
function micErrorToMessage(err: unknown): string {
	const msg = err instanceof Error ? err.message : '';
	const name = err instanceof DOMException ? err.name : '';
	if (
		name === 'NotFoundError' ||
		/requested device not found|device not found/i.test(msg)
	)
		return 'No se encontró ningún micrófono. Conecta un micrófono o desactiva la opción de audio.';
	if (
		name === 'NotAllowedError' ||
		/permission denied|Permission denied/i.test(msg)
	)
		return 'Se ha denegado el acceso al micrófono. Revisa los permisos del navegador.';
	if (name === 'NotReadableError' || /could not start|not readable/i.test(msg))
		return 'No se pudo usar el micrófono (puede estar en uso por otra aplicación).';
	if (msg) return msg;
	return 'Error al acceder al micrófono.';
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
 * Hook para captura de micrófono (getUserMedia audio).
 */
export function useMicrophone() {
	const streamRef = useRef<MediaStream | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isActive, setIsActive] = useState(false);
	const [deviceNotFound, setDeviceNotFound] = useState(false);

	const start = useCallback(
		async (deviceId?: string): Promise<MediaStream | null> => {
			setError(null);
			setDeviceNotFound(false);
			try {
				const audio = deviceId ? { deviceId: { exact: deviceId } } : true;
				const stream = await navigator.mediaDevices.getUserMedia({ audio });
				streamRef.current = stream;
				setIsActive(true);
				return stream;
			} catch (err) {
				setError(micErrorToMessage(err));
				setDeviceNotFound(isDeviceNotFoundError(err));
				return null;
			}
		},
		[],
	);

	const stop = useCallback(() => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((t) => t.stop());
			streamRef.current = null;
		}
		setIsActive(false);
		setError(null);
		// No borrar deviceNotFound: si no hay micrófono debe seguir true para la UI.
	}, []);

	return { start, stop, isActive, error, deviceNotFound, streamRef };
}
