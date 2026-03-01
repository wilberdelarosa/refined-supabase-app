# Video de uso — Barbaro Nutrition

En este directorio se genera un **video de demostración** del uso de la página (recorrido por inicio, tienda, producto, sobre nosotros, auth y opcionalmente panel admin).

## Cómo generar el video

1. **Requisito:** tener Chromium instalado para Playwright (si ya ejecutaste capturas, ya está):
   ```bash
   npx playwright install chromium
   ```

2. **Iniciar la aplicación** en una terminal (puerto 8080):
   ```bash
   npm run dev
   ```

3. En **otra terminal**, grabar el video:
   ```bash
   npm run demo-video
   ```

4. El archivo se guarda en **`docs/videos/barbaro-demo.webm`**.

## Incluir panel admin en el video

Para que el video recorra también el dashboard y las pantallas de administración, define las variables de entorno antes de ejecutar (PowerShell):

```powershell
$env:E2E_ADMIN_EMAIL="tu-admin@ejemplo.com"
$env:E2E_ADMIN_PASSWORD="tu-password"
npm run demo-video
```

## Formato (video profesional)

- **Formato:** WebM (reproducible en Chrome, Edge, Firefox y la mayoría de navegadores).
- **Resolución:** 1280×720.
- **Duración aproximada:** 8–12 minutos (con admin: recorrido completo público + panel admin).
- **Contenido:** navegación automática por todas las pantallas relevantes; pausas largas (6–12 s por pantalla) para narración. Incluye scroll en tienda y producto, apertura del carrito y, si hay credenciales admin, todo el panel (dashboard, pedidos, productos, inventario, categorías, métodos de pago, descuentos, facturas, usuarios).

Si necesitas otro formato (por ejemplo MP4), puedes convertir el WebM con alguna herramienta externa (p. ej. FFmpeg: `ffmpeg -i barbaro-demo.webm barbaro-demo.mp4`).

## Guion y narración (voz clonada / ElevenLabs)

Para narrar el video con tu voz clonada (p. ej. ElevenLabs o Clawd):

- **Guion de narración** y **guía ampliada del uso de cada apartado:** [guion-demo-y-guia-uso.md](guion-demo-y-guia-uso.md)
- El guion está dividido por escena (inicio, tienda, producto, about, auth, dashboard, pedidos, productos, cierre). Puedes copiar cada bloque en ElevenLabs o tu herramienta de voz.
- Para usar la API de ElevenLabs sin guardar credenciales en el repo: configura `ELEVENLABS_API_KEY` (y si aplica `ELEVENLABS_VOICE_ID`) en tu entorno o en un archivo `.env` local no versionado.
