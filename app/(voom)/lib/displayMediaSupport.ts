/**
 * Comprueba si el entorno actual soporta la API de compartir pantalla (getDisplayMedia).
 * No está soportada en muchos navegadores móviles (p. ej. Safari en iOS).
 */
export function isDisplayMediaSupported(): boolean {
	if (typeof navigator === "undefined") return false;
	const md = navigator.mediaDevices;
	return typeof md?.getDisplayMedia === "function";
}
