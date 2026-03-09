/**
 * Camera Performance Engine: optimización de captura de cámara según
 * hardware, tamaño en UI y cámara seleccionada.
 */

export {
  getOptimalCameraConstraints,
  getPerformanceProfile,
  isLowEndDevice,
  getOptimalCameraResolution,
  buildVideoConstraints,
} from "./cameraEngine";

export type {
  OptimalCameraConstraintsInput,
  PerformanceProfile,
  CameraConstraintsInput,
} from "./cameraEngine";

export { PROFILE_LIMITS } from "./performanceProfile";
export type { OptimalResolution } from "./resolutionCalculator";
export { getRetinaFactor } from "./resolutionCalculator";
