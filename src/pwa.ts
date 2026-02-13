import { registerSW } from "virtual:pwa-register";

export function initPWA() {
  const updateSW = registerSW({
    immediate: true,
    onOfflineReady() {
      console.info("PWA listo para usar sin conexion.");
    },
    onNeedRefresh() {
      console.info("Hay una actualizacion disponible, recargando...");
      updateSW(true);
    },
  });
}
