# Camera Performance Engine

Motor de optimización de la captura de cámara para Voom. Adapta resolución y FPS al hardware, al tamaño en UI y a la cámara seleccionada, evitando pedir 1080p cuando el video se muestra en un círculo pequeño (lag en dispositivos con poca RAM/CPU).

## 1. Algoritmo de optimización (paso a paso)

1. **Perfil de hardware**  
   `getPerformanceProfile()` usa `navigator.hardwareConcurrency` y `navigator.deviceMemory`:
   - **low**: ≤2 cores o ≤2 GB RAM → techo 320×180, 15 fps
   - **medium**: ≤4 cores o ≤4 GB RAM → techo 640×360, 24 fps
   - **high**: resto → techo 960×540, 30 fps

2. **Modo rendimiento manual**  
   Si el usuario activa "modo rendimiento", se fuerza perfil **low** independientemente del hardware.

3. **Tamaño en UI**  
   Si se pasa `uiSizePx` (diámetro del círculo en pantalla, ej. 120, 222, 400):
   - `idealRaw = uiSizePx * min(2, devicePixelRatio)` (factor retina, máx. 2).
   - Se elige la resolución estándar más pequeña ≥ `idealRaw` y ≤ techo del perfil.
   - Resoluciones estándar: 160, 320, 480, 640, 720, 960, 1280 (ancho).
   - Alto = ancho × 9/16, limitado por el techo del perfil.

4. **Constraints para getUserMedia**  
   Se construye `MediaTrackConstraints` con:
   - `width` / `height`: `ideal` (calculado) y `max` (techo del perfil).
   - `frameRate`: `ideal` y `max` = techo del perfil.
   - `deviceId: { exact }` cuando el usuario eligió una cámara.

Así se pide solo la resolución necesaria para el círculo (y un poco más por retina), sin superar el techo del perfil.

## 2. Fórmulas / heurísticas

- **Perfil**  
  `low` si `cores ≤ 2 || memoryGB ≤ 2`; `medium` si `cores ≤ 4 || memoryGB ≤ 4`; si no, `high`.

- **Resolución ideal (ancho)**  
  `idealRaw = ceil(uiSizePx * retinaFactor)` con `retinaFactor = min(2, devicePixelRatio || 2)`.  
  Ancho final = menor estándar ≥ `idealRaw` y ≤ `maxWidth` del perfil.

- **Ejemplo círculo 120px**  
  `idealRaw = 240` → ancho 320 (primer estándar ≥ 240). En perfil low (max 320) queda 320×180 @ 15 fps. Se evita pedir 1080p.

## 3. Reducción de carga CPU

- Resolución dinámica según UI y perfil (nunca más de 960×540).
- FPS limitados por perfil (15 / 24 / 30).
- `ideal` + `max` en constraints para que el navegador negocie sin fallar.
- Uso de la cámara seleccionada por el usuario (`deviceId`) para no depender de la primera del array.

## 4. Detección de bajo rendimiento y modo automático

- `isLowEndDevice()` ⇔ `getPerformanceProfile() === "low"`.
- En la primera carga (sin opciones guardadas), si `isLowEndDevice()` es true, se activa `performanceMode` por defecto en las opciones del recorder.

## 5. Archivos

| Archivo                   | Responsabilidad                                                              |
| ------------------------- | ---------------------------------------------------------------------------- |
| `performanceProfile.ts`   | Perfil low/medium/high y límites por perfil.                                 |
| `resolutionCalculator.ts` | Cálculo de ancho/alto óptimos a partir de `uiSizePx` y techos.               |
| `videoConstraints.ts`     | Construcción de `MediaTrackConstraints` a partir de perfil, UI y `deviceId`. |
| `cameraEngine.ts`         | API pública: `getOptimalCameraConstraints()`.                                |
| `index.ts`                | Re-exportaciones del módulo.                                                 |

## 6. Uso

El hook `useCamera` ya usa el engine. Se llama con:

- `performanceMode`: fuerza perfil low.
- `deviceId`: cámara elegida por el usuario.
- `uiSizePx`: diámetro del círculo (p. ej. `options.circleDiameterPx ?? CIRCLE_DIAMETER_DEFAULT`).

No hace falta invocar el engine a mano salvo para tests o herramientas de diagnóstico.
