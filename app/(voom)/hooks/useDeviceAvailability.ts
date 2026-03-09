'use client';

import { useCallback, useEffect, useState } from 'react';

export interface DeviceAvailability {
	/** Hay al menos un dispositivo de tipo videoinput (no pide permisos). */
	hasCamera: boolean;
	/** Hay al menos un dispositivo de tipo audioinput (no pide permisos). */
	hasMicrophone: boolean;
	/** Lista de cámaras (puede tener labels vacíos hasta que se conceda permiso). */
	videoDevices: MediaDeviceInfo[];
	/** Lista de micrófonos. */
	audioDevices: MediaDeviceInfo[];
	/** true mientras se ejecuta enumerateDevices. */
	isLoading: boolean;
	/** Error si falla la enumeración. */
	error: string | null;
	/** Vuelve a enumerar (útil si el usuario conecta/desconecta dispositivos). */
	refresh: () => Promise<void>;
}

/**
 * Detecta si hay cámaras y micrófonos usando solo enumerateDevices().
 * No pide permisos de cámara/micrófono: el conteo es fiable incluso sin permisos
 * (los labels vendrán vacíos hasta que se conceda permiso).
 *
 * Uso tipo Loom: si videoinput.length === 0, no mostrar opción de cámara.
 */
export function useDeviceAvailability(active: boolean): DeviceAvailability {
	const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
	const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
			setVideoDevices([]);
			setAudioDevices([]);
			setError('Tu navegador no soporta la enumeración de dispositivos.');
			return;
		}
		setIsLoading(true);
		setError(null);
		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			const video = devices.filter((d) => d.kind === 'videoinput');
			const audio = devices.filter((d) => d.kind === 'audioinput');
			setVideoDevices(video);
			setAudioDevices(audio);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Error al detectar dispositivos';
			setError(message);
			setVideoDevices([]);
			setAudioDevices([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!active) return;
		refresh();
	}, [active, refresh]);

	return {
		hasCamera: videoDevices.length > 0,
		hasMicrophone: audioDevices.length > 0,
		videoDevices,
		audioDevices,
		isLoading,
		error,
		refresh,
	};
}
