'use client';

import type { RecordingResolution } from '@voom/types/recorder';
import { useCallback, useRef, useState } from 'react';

const RESOLUTION_MAP: Record<
	RecordingResolution,
	{ width: number; height: number } | undefined
> = {
	'720p': { width: 1280, height: 720 },
	'1080p': { width: 1920, height: 1080 },
	native: undefined,
};

/**
 * Hook para captura de pantalla (getDisplayMedia).
 * Limitación: en algunos navegadores solo funciona en contexto seguro (HTTPS o localhost).
 */
export function useScreenCapture() {
	const streamRef = useRef<MediaStream | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isCapturing, setIsCapturing] = useState(false);

	const stopCapture = useCallback(() => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((t) => t.stop());
			streamRef.current = null;
		}
		setIsCapturing(false);
		setError(null);
	}, []);

	const startCapture = useCallback(
		async (
			resolution: RecordingResolution = '720p',
			onStoppedByBrowser?: () => void,
		): Promise<MediaStream | null> => {
			setError(null);
			const size = RESOLUTION_MAP[resolution];
			try {
				const stream = await navigator.mediaDevices.getDisplayMedia({
					video: size
						? {
								displaySurface: 'monitor',
								width: size.width,
								height: size.height,
							}
						: { displaySurface: 'monitor' },
					audio: true,
				});
				streamRef.current = stream;
				stream.getVideoTracks()[0].onended = () => {
					stopCapture();
					onStoppedByBrowser?.();
				};
				setIsCapturing(true);
				return stream;
			} catch (err) {
				const message =
					err instanceof Error ? err.message : 'Error al capturar pantalla';
				setError(message);
				return null;
			}
		},
		[stopCapture],
	);

	return { startCapture, stopCapture, isCapturing, error, streamRef };
}
