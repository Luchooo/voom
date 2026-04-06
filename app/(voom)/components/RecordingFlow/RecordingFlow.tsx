'use client';

import { useAuth } from '@/hooks/useAuth';
import { PreviewVideoPlayer } from '@voom/components/PreviewVideoPlayer';
import { useDeviceAvailability } from '@voom/hooks/useDeviceAvailability';
import { useRecorder } from '@voom/hooks/useRecorder';
import { isLowEndDevice } from '@voom/lib/camera';
import { isDisplayMediaSupported } from '@voom/lib/displayMediaSupport';
import {
	clearRecorderStorage,
	getCameraUnavailable,
	loadCameraOverlay,
	loadRecorderOptions,
	saveCameraOverlay,
	saveRecorderOptions,
	setCameraUnavailable,
	type StoredCameraOverlay,
} from '@voom/lib/recorderStorage';
import type { CameraOverlayState } from '@voom/types/recorder';
import {
	type CameraOverlaySize,
	CIRCLE_DIAMETER_DEFAULT,
	CIRCLE_DIAMETER_MAX,
	CIRCLE_DIAMETER_MIN,
	type RecorderOptions,
	type RecordingFlowState,
} from '@voom/types/recorder';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Spinner } from '../../../components/ui/spinner';
import { DiscardRecordingDialog } from './DiscardRecordingDialog';
import {
	CircularCameraPreview,
	CountdownStep,
	DeviceSetupCard,
	DisplayMediaUnsupportedStep,
	RecordingOverlay,
	TrimEditorStep,
	WelcomeStep,
} from './steps';
import { VersionDropdown } from './VersionDropdown';

const DEFAULT_OPTIONS: RecorderOptions = {
	screen: true,
	microphone: true,
	camera: true,
	resolution: '720p',
	frameRate: 60,
	performanceMode: true,
	flipCamera: true,
	circleDiameterPx: CIRCLE_DIAMETER_DEFAULT,
	countdownSeconds: 3,
	muteStartSound: false,
};

const DEFAULT_CAMERA: StoredCameraOverlay = {
	position: { x: 32, y: 320 },
	size: 'small',
};

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n));
}

function getInitialOptions(): RecorderOptions {
	if (typeof window === 'undefined') return DEFAULT_OPTIONS;
	const loaded = loadRecorderOptions() ?? DEFAULT_OPTIONS;
	const merged: RecorderOptions = {
		...DEFAULT_OPTIONS,
		...loaded,
		flipCamera: loaded.flipCamera ?? DEFAULT_OPTIONS.flipCamera,
		circleDiameterPx: clamp(
			loaded.circleDiameterPx ?? CIRCLE_DIAMETER_DEFAULT,
			CIRCLE_DIAMETER_MIN,
			CIRCLE_DIAMETER_MAX,
		),
	};
	// Si la última vez no había cámara, cargar con cámara desactivada para evitar que el switch aparezca ON al refrescar.
	if (getCameraUnavailable()) merged.camera = false;
	// En dispositivos de bajo rendimiento, activar modo rendimiento si es la primera carga (sin opciones guardadas).
	if (loaded == null && isLowEndDevice()) merged.performanceMode = true;
	return merged;
}

function getInitialCamera(): StoredCameraOverlay {
	if (typeof window === 'undefined') return DEFAULT_CAMERA;
	return loadCameraOverlay() ?? DEFAULT_CAMERA;
}

/**
 * Flujo de pre-grabación: welcome → device_setup → (screen selection) → countdown → recording → ready.
 * Tras una grabación, «Grabar de nuevo» vuelve a device_setup (no al welcome). Opciones y overlay se persisten.
 */
export function RecordingFlow({
	showMp4Option = false,
}: {
	showMp4Option?: boolean;
}) {
	const [flowState, setFlowState] = useState<RecordingFlowState>('welcome');
	const [options, setOptions] = useState<RecorderOptions>(getInitialOptions);
	const [cameraState, setCameraState] =
		useState<StoredCameraOverlay>(getInitialCamera);
	const [storageKey, setStorageKey] = useState(0);
	const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
	const [displayMediaUnsupported] = useState(
		() => typeof window !== 'undefined' && !isDisplayMediaSupported(),
	);
	const overlayRef = useRef<CameraOverlayState | null>(null);
	const flowStateRef = useRef<RecordingFlowState>(flowState);
	const downloadMenuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		flowStateRef.current = flowState;
	}, [flowState]);

	useEffect(() => {
		saveRecorderOptions(options);
	}, [options]);

	const handleCameraStateChange = useCallback(
		(position: { x: number; y: number }, size: CameraOverlaySize) => {
			setCameraState({ position, size });
			saveCameraOverlay({ position, size });
		},
		[],
	);

	const handleCircleDiameterChange = useCallback((diameterPx: number) => {
		setOptions((prev) => ({
			...prev,
			circleDiameterPx: clamp(
				diameterPx,
				CIRCLE_DIAMETER_MIN,
				CIRCLE_DIAMETER_MAX,
			),
		}));
	}, []);

	const handleClearSettings = useCallback(() => {
		clearRecorderStorage();
		setOptions(DEFAULT_OPTIONS);
		setCameraState(DEFAULT_CAMERA);
		setStorageKey((k) => k + 1);
	}, []);

	const isDeviceSetup = flowState === 'device_setup';
	const availability = useDeviceAvailability(isDeviceSetup);

	const overlayIsAvatar = cameraState.size === 'avatar';
	/** Cámara encendida en configuración y hasta que empiece la grabación (modal + cuenta atrás), para no cortar el stream. */
	const cameraPreviewVideoEnabled =
		options.camera &&
		!overlayIsAvatar &&
		(flowState === 'device_setup' ||
			flowState === 'awaiting_screen_selection' ||
			flowState === 'countdown');
	const { user } = useAuth();
	const avatarPhotoUrl = user?.photoURL ?? null;

	const {
		error,
		recordingResult,
		versions,
		currentVersionIndex,
		setCurrentVersion,
		startRecording,
		stopRecording,
		downloadRecording,
		isConvertingToMp4,
		reset,
		addTrimmedVersion,
		status,
		camera,
		mic,
		screen,
	} = useRecorder(
		options,
		overlayRef,
		cameraPreviewVideoEnabled,
		avatarPhotoUrl,
		overlayIsAvatar,
		false,
	);

	// Sincronizar switches con dispositivos detectados: sin dispositivo → false; con dispositivo → true.
	useEffect(() => {
		if (!isDeviceSetup || availability.isLoading) return;
		const id = setTimeout(() => {
			setOptions((prev) => {
				const updates: Partial<RecorderOptions> = {};
				updates.camera = availability.hasCamera;
				updates.microphone = availability.hasMicrophone;
				return { ...prev, ...updates };
			});
		}, 0);
		return () => clearTimeout(id);
	}, [
		isDeviceSetup,
		availability.isLoading,
		availability.hasCamera,
		availability.hasMicrophone,
	]);

	// Cerrar menú de descarga al hacer clic fuera
	useEffect(() => {
		if (!downloadMenuOpen) return;
		const handleClick = (e: MouseEvent) => {
			if (
				downloadMenuRef.current &&
				!downloadMenuRef.current.contains(e.target as Node)
			) {
				setDownloadMenuOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, [downloadMenuOpen]);

	// Cuando el hook tiene video listo, pasar a la pantalla "Grabación lista" (no antes: evita overlay vacío / negro).
	useEffect(() => {
		if (status !== 'ready' || flowState !== 'recording') return;
		if (versions.length === 0) return;
		const t = setTimeout(() => setFlowState('ready'), 0);
		return () => clearTimeout(t);
	}, [status, flowState, versions.length]);

	// Sincronizar opción de cámara cuando el hook reporta que no hay dispositivo.
	useEffect(() => {
		if (!camera?.deviceNotFound || !options.camera) return;
		const id = setTimeout(() => {
			setOptions((prev) => ({ ...prev, camera: false }));
			setCameraUnavailable(true);
		}, 0);
		return () => clearTimeout(id);
	}, [camera?.deviceNotFound, options.camera]);

	// Sincronizar opción de micrófono cuando el hook reporta que no hay dispositivo.
	useEffect(() => {
		if (!mic?.deviceNotFound || !options.microphone) return;
		const id = setTimeout(
			() => setOptions((prev) => ({ ...prev, microphone: false })),
			0,
		);
		return () => clearTimeout(id);
	}, [mic?.deviceNotFound, options.microphone]);

	// Si la cámara funciona, quitar el flag para no forzar false en futuras cargas (p. ej. con cámara conectada).
	useEffect(() => {
		if (options.camera && camera?.stream) setCameraUnavailable(false);
	}, [options.camera, camera?.stream]);

	const handleStartSetup = useCallback(() => {
		setFlowState('device_setup');
	}, []);

	const handleStartRecordingClick = useCallback(async () => {
		setFlowState('awaiting_screen_selection');
		// Si el usuario pulsa "Dejar de compartir" durante countdown → volver a configuración.
		// Si ya está grabando → no cambiar vista; useRecorder detendrá y el efecto pondrá flowState en 'ready'.
		const stream = await screen.startCapture(options.resolution, () => {
			if (flowStateRef.current !== 'recording') setFlowState('device_setup');
		});
		if (!stream) {
			setFlowState('device_setup');
			return;
		}
		setFlowState('countdown');
	}, [screen, options.resolution]);

	const handleReachOne = useCallback(() => {
		if (options.muteStartSound === true) return;
		try {
			const audio = new Audio('/init.mp3');
			audio.volume = 1;
			void audio.play();
		} catch {
			// Ignorar si el navegador no permite reproducir
		}
	}, [options.muteStartSound]);

	const handleCountdownComplete = useCallback(() => {
		const winW = typeof window !== 'undefined' ? window.innerWidth : 1920;
		const winH = typeof window !== 'undefined' ? window.innerHeight : 1080;
		const overlayState: CameraOverlayState = {
			xRatio:
				winW > 0 ? Math.max(0, Math.min(1, cameraState.position.x / winW)) : 0,
			yRatio:
				winH > 0 ? Math.max(0, Math.min(1, cameraState.position.y / winH)) : 0,
			circleDiameterPx:
				cameraState.size === 'fullscreen'
					? undefined
					: (options.circleDiameterPx ?? CIRCLE_DIAMETER_DEFAULT),
			isFullScreen: cameraState.size === 'fullscreen',
			isAvatar: cameraState.size === 'avatar',
		};
		startRecording({ useExistingScreenStream: true, overlayState });
		setFlowState('recording');
	}, [startRecording, cameraState, options.circleDiameterPx]);

	const handleStopRecording = useCallback(() => {
		stopRecording();
	}, [stopRecording]);

	const handleDiscardAndRecordAgain = useCallback(() => {
		reset();
		setFlowState('device_setup');
	}, [reset]);

	const handleApplyTrim = useCallback(
		(trimmedBlob: Blob, newDurationSeconds: number) => {
			addTrimmedVersion(trimmedBlob, newDurationSeconds);
			setFlowState('ready');
		},
		[addTrimmedVersion],
	);

	const handleCancelTrim = useCallback(() => {
		setFlowState('ready');
	}, []);

	if (
		flowState === 'recording' ||
		flowState === 'ready' ||
		flowState === 'trim'
	) {
		return (
			<RecordingOverlay>
				{flowState === 'recording' && (
					<div className="flex h-full min-h-0 flex-col items-center justify-center gap-6 overflow-hidden p-8">
						<div className="rounded-full bg-orange-500/20 px-4 py-2 text-sm font-medium text-orange-200">
							{status === 'stopping' ? 'Finalizando…' : 'Grabando…'}
						</div>
						<Button
							type="button"
							variant="orange"
							size="lg"
							onClick={handleStopRecording}
							disabled={status === 'stopping'}
							className="px-6 py-2.5 font-semibold"
						>
							Detener
						</Button>
					</div>
				)}
				{flowState === 'trim' && recordingResult && (
					<TrimEditorStep
						videoUrl={recordingResult.url}
						blob={recordingResult.blob}
						durationSeconds={recordingResult.durationSeconds}
						onApplyTrim={handleApplyTrim}
						onCancel={handleCancelTrim}
					/>
				)}
				{flowState === 'ready' && recordingResult && (
					<div className="flex h-full min-h-0 w-full flex-col items-center justify-center gap-3 overflow-hidden p-4 sm:gap-4 sm:p-6">
						<p className="shrink-0 text-sm text-foreground">
							Grabación lista ({recordingResult.durationSeconds.toFixed(1)} s)
						</p>
						<div className="w-full max-w-4xl shrink-0">
							<PreviewVideoPlayer
								src={recordingResult.url}
								className="w-full max-w-full"
							/>
						</div>
						<div className="flex shrink-0 flex-wrap items-center justify-center gap-3">
							<div ref={downloadMenuRef} className="relative flex">
								{showMp4Option ? (
									<>
										<Button
											type="button"
											variant="orange"
											size="lg"
											disabled={isConvertingToMp4}
											onClick={() => void downloadRecording('webm')}
											className="min-w-40 rounded-r-none [&_svg]:h-5 [&_svg]:w-5"
										>
											{isConvertingToMp4 && (
												<Spinner size="sm" className="shrink-0" />
											)}
											{isConvertingToMp4 ? 'Descargando…' : 'Descargar'}
										</Button>
										<Button
											type="button"
											variant="orange"
											size="icon"
											disabled={isConvertingToMp4}
											onClick={() => setDownloadMenuOpen((o) => !o)}
											aria-expanded={downloadMenuOpen}
											aria-haspopup="true"
											aria-label="Más opciones de descarga"
											className="h-10 w-10 rounded-l-none border-l border-white/20 [&_svg]:h-5 [&_svg]:w-5"
										>
											<svg
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												aria-hidden
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M19 9l-7 7-7-7"
												/>
											</svg>
										</Button>
										{downloadMenuOpen && (
											<div className="absolute left-0 top-full z-10 mt-1 min-w-[180px] rounded-lg border border-border bg-card py-1 shadow-xl">
												<Button
													type="button"
													variant="ghost"
													size="lg"
													className="w-full justify-start px-4 py-2.5 text-sm font-normal"
													onClick={() => {
														void downloadRecording('mp4');
														setDownloadMenuOpen(false);
													}}
												>
													Descargar en .mp4
												</Button>
											</div>
										)}
									</>
								) : (
									<Button
										type="button"
										variant="orange"
										size="lg"
										disabled={isConvertingToMp4}
										onClick={() => void downloadRecording('webm')}
										className="min-w-40 [&_svg]:h-5 [&_svg]:w-5"
									>
										{isConvertingToMp4 && (
											<Spinner size="sm" className="shrink-0" />
										)}
										{isConvertingToMp4 ? 'Descargando…' : 'Descargar'}
									</Button>
								)}
							</div>
							<VersionDropdown
								versions={versions}
								currentVersionIndex={currentVersionIndex}
								onSelectVersion={setCurrentVersion}
								onEditVideo={() => setFlowState('trim')}
							/>
							<DiscardRecordingDialog
								onConfirm={handleDiscardAndRecordAgain}
								trigger={
									<Button
										type="button"
										variant="secondary"
										size="lg"
										className="border-2 border-border"
									>
										Grabar de nuevo
									</Button>
								}
							/>
						</div>
					</div>
				)}
			</RecordingOverlay>
		);
	}

	if (displayMediaUnsupported) {
		return (
			<RecordingOverlay>
				<DisplayMediaUnsupportedStep />
			</RecordingOverlay>
		);
	}

	return (
		<RecordingOverlay>
			{flowState === 'welcome' && <WelcomeStep onStart={handleStartSetup} />}

			{flowState === 'device_setup' && (
				<>
					<DeviceSetupCard
						options={options}
						onOptionsChange={setOptions}
						onStartRecording={handleStartRecordingClick}
						onClearSettings={handleClearSettings}
						isRequestingScreen={false}
						cameraAvailable={availability.hasCamera}
						cameraNotFound={camera?.deviceNotFound ?? false}
						microphoneAvailable={availability.hasMicrophone}
						microphoneNotFound={mic?.deviceNotFound ?? false}
						devicesLoading={availability.isLoading}
						cameraOverlaySize={cameraState.size}
					/>
					{options.camera && !camera?.deviceNotFound && (
						<CircularCameraPreview
							key={storageKey}
							stream={camera.stream}
							avatarPhotoUrl={avatarPhotoUrl}
							overlayRef={overlayRef}
							initialPosition={cameraState.position}
							initialSize={cameraState.size}
							circleDiameterPx={
								options.circleDiameterPx ?? CIRCLE_DIAMETER_DEFAULT
							}
							flipCamera={options.flipCamera !== false}
							onStateChange={handleCameraStateChange}
							onCircleDiameterChange={handleCircleDiameterChange}
						/>
					)}
				</>
			)}

			{flowState === 'awaiting_screen_selection' && (
				<>
					<DeviceSetupCard
						options={options}
						onOptionsChange={setOptions}
						onStartRecording={() => {}}
						onClearSettings={handleClearSettings}
						isRequestingScreen
						cameraAvailable={availability.hasCamera}
						cameraNotFound={camera?.deviceNotFound ?? false}
						microphoneAvailable={availability.hasMicrophone}
						microphoneNotFound={mic?.deviceNotFound ?? false}
						devicesLoading={availability.isLoading}
						cameraOverlaySize={cameraState.size}
					/>
					<div className="flex h-full min-h-0 items-center justify-center overflow-hidden p-8">
						<p className="text-foreground">
							Selecciona qué compartir en el diálogo del navegador…
						</p>
					</div>
				</>
			)}

			{flowState === 'countdown' && (
				<CountdownStep
					onComplete={handleCountdownComplete}
					onReachOne={handleReachOne}
					seconds={options.countdownSeconds ?? 3}
				/>
			)}

			{error && (
				<div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-lg border border-red-500/50 bg-red-500/20 px-4 py-2 text-sm text-red-200">
					{error}
				</div>
			)}
		</RecordingOverlay>
	);
}
