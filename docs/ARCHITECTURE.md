# Arquitectura Voom

## Estructura de carpetas

Todo el proyecto vive en la raíz; no se usa carpeta `src/`. Las rutas y el feature siguen la [convención de Next.js App Router](https://nextjs.org/docs/app/getting-started/layouts-and-pages).

```
app/                         # App Router (raíz del proyecto)
├── layout.tsx               # Layout global, fuentes, metadata
├── page.tsx                 # Página raíz: monta RecorderPage
├── globals.css              # Estilos globales y variables CSS (tema)
├── favicon.ico
├── components/              # Componentes UI compartidos (estilo shadcn)
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       └── toggle.tsx
└── (voom)/                  # Route group (no añade segmento a la URL)
    ├── RecorderPage.tsx     # Página del recorder
    ├── actions/             # Server Actions / mutaciones (futuro)
    ├── components/           # UI del recorder
    │   ├── CameraPreview.tsx
    │   ├── Recorder.tsx
    │   └── RecorderControls.tsx
    ├── context/              # React Context si hace falta
    ├── hooks/                # Lógica de grabación
    │   ├── useCamera.ts
    │   ├── useMicrophone.ts
    │   ├── useRecorder.ts    # Orquestador principal
    │   └── useScreenCapture.ts
    ├── lib/                  # Utilidades
    │   ├── download.ts
    │   ├── mediaRecorder.ts
    │   └── streams.ts
    └── types/
        └── recorder.ts
```

- **`app/`**: layout, página raíz, globals y todo el feature (voom) en el route group `(voom)`.
- **`@voom/*`**: alias en `tsconfig.json` que apunta a `./app/(voom)/*`.
- **`@/*`**: alias que apunta a `./*` (raíz del proyecto).

## Flujo técnico de grabación

1. **Opciones**: el usuario activa pantalla, micrófono y/o cámara (estado local en `Recorder`).
2. **Iniciar**:
   - Se pide captura de pantalla (`getDisplayMedia`) → `MediaStream`.
   - Si micrófono: `getUserMedia({ audio: true })`.
   - Si cámara: ya está activa por `useCamera(options.camera)` y hay stream disponible.
   - Se combinan streams: pantalla + cámara (opcional) en un solo video vía canvas (picture-in-picture); se añade el audio del micrófono al stream resultante.
   - Se crea `MediaRecorder` con ese stream, MIME type detectado (`getSupportedMimeType`) y se llama a `start()`.
3. **Grabando**: `MediaRecorder` emite `ondataavailable`; los `Blob` se acumulan en un array.
4. **Detener**: `recorder.stop()`; en `onstop` se construye un único `Blob`, se crea URL y se actualiza el estado a "ready".
5. **Descarga**: el usuario pulsa "Descargar video"; se usa `downloadBlob` con nombre generado por timestamp.

Limitaciones conocidas de las APIs del navegador:

- `getDisplayMedia` suele requerir contexto seguro (HTTPS o localhost).
- Soporte de `video/webm;codecs=vp9,opus` no es universal; se usa `getSupportedMimeType()` para elegir vp9, vp8 o solo `video/webm`.

## Mejoras futuras recomendadas

1. **Persistencia**: subir la grabación a un backend (p. ej. S3) desde una Server Action en `actions/`.
2. **Preview del video grabado**: reproducir el resultado antes de descargar (reproductor con `recordingResult.url`).
3. **Indicador de tiempo**: mostrar duración en vivo durante la grabación.
4. **Selector de fuente**: elegir ventana/pestaña/pantalla cuando hay varias.
5. **Calidad/configuración**: selector de resolución o bitrate antes de grabar.
6. **Estado global**: si más pantallas necesitan el estado del recorder, moverlo a un Context en `context/`.
7. **Tests**: tests unitarios para hooks (`useRecorder`, `useScreenCapture`, etc.) y de integración para el flujo de grabación.
8. **Manejo de errores**: mensajes más claros por tipo de error (permiso denegado, dispositivo no encontrado, etc.).
