# Editor de recorte (Trim) — Arquitectura

## Objetivo

Permitir al usuario recortar el **inicio** y/o el **final** del video grabado (sin timeline compleja ni múltiples cortes), similar a CapCut pero minimalista.

## Flujo

1. Usuario termina de grabar → pantalla "Grabación lista" con: Descargar, Grabar de nuevo, **Editar video**.
2. Al pulsar "Editar video" → se muestra el **TrimEditor**: reproductor + slider de inicio + slider de final + "Aplicar recorte".
3. Usuario ajusta inicio/fin, previsualiza, pulsa "Aplicar recorte" → se genera un nuevo Blob recortado.
4. El resultado recortado **reemplaza** la grabación actual: se vuelve a la pantalla "Grabación lista" con el video ya recortado (puede descargar o grabar de nuevo).

## Tecnología elegida: FFmpeg.wasm

- **Por qué**: El proyecto ya usa `@ffmpeg/ffmpeg` para WebM→MP4. Reutilizar el mismo runtime para recorte evita añadir dependencias y da salida precisa y sin re-codificar si usamos *stream copy*.
- **Comando de recorte**: `-i input.webm -ss START -to END -c copy output.webm`
  - `-ss` inicio en segundos, `-to` fin en segundos.
  - `-c copy` copia streams sin re-encodear → rápido y sin pérdida.
- **Alternativas consideradas**:
  - **WebCodecs + webm-muxer**: control total y menor peso, pero exige demux → decode → trim por frames → encode → mux; más complejo y frágil.
  - **Canvas + MediaRecorder**: reproducir el video y grabar solo el tramo; posible pero problemas de sincronía y calidad. No elegido.

## Cálculo de inicio y fin

- **Unidades**: segundos en punto flotante (`startTime`, `endTime`).
- **Restricciones**: `0 ≤ startTime < endTime ≤ duration`.
- **UI**: Dos controles (slider de inicio y slider de fin) o un único range de dos thumbs. Al mover uno se recalcula el otro para mantener `start < end` y que no se crucen (p. ej. margen mínimo 1 s).

## Generación del Blob recortado

1. Escribir el Blob de entrada en el sistema de archivos virtual de FFmpeg (`input.webm`).
2. Ejecutar: `-i input.webm -ss startTime -to endTime -c copy output.webm`.
3. Leer `output.webm` como `Uint8Array` y construir `new Blob([buffer], { type: 'video/webm' })`.
4. Limpiar archivos virtuales.

El hook de grabación expone `replaceResult(blob, durationSeconds)` para que, tras el recorte, el flujo sustituya la grabación actual por el Blob recortado y actualice la duración mostrada.

## UX del editor (minimalista)

- **Reproductor**: `<video>` con `src={url}`, controles nativos, `playsInline`.
- **Barra de recorte**: Dos sliders (inicio y fin) sobre la misma escala 0…duration, con etiquetas en MM:SS.
- **Previsualización**: Al mover los sliders, opcionalmente hacer `video.currentTime = startTime` para que el usuario vea por dónde empieza el corte; o un botón "Reproducir tramo" que haga play desde start hasta end.
- **Botones**: "Aplicar recorte" (ejecuta trim y reemplaza resultado) y "Cancelar" (vuelve a "Grabación lista" sin cambiar el video).
