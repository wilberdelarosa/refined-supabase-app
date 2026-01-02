# Benchmark Shopify y roadmap para app de gestion de tiendas

## Objetivo
Alinear la app con capacidades tipicas de Shopify para administrar tiendas en linea de forma profesional.

## Lo que ya tienes (segun el proyecto actual)
- Catalogo de productos con categorias, precios, stock y destacados.
- Carrito local persistente y wishlist.
- Checkout por transferencia con descuentos.
- Ordenes con estados y detalle de items.
- Facturas con impresion.
- Panel admin para productos, inventario, descuentos, pedidos, usuarios.
- Roles y RLS en Supabase.
- Email transaccional para pedidos.

## Comparativo de capacidades (Shopify vs app)
| Area | Shopify permite | Estado actual | Falta integrar |
| --- | --- | --- | --- |
| Catalogo | Productos, variantes, colecciones, tags, SKU, codigos de barras | Parcial (productos + categorias + stock) | Variantes, atributos, colecciones, tags, SKU, media avanzada |
| Inventario | Multi ubicacion, reservas, alertas, conteos | Parcial (stock manual) | Multi ubicacion, reservas, alertas, historico |
| Checkout y pagos | Pasarelas, pago con tarjeta, wallet, contra reembolso | No (solo transferencia) | Integrar gateway, webhooks, conciliacion |
| Impuestos | Reglas por region, calculo automatico | Parcial (factura con ITBIS fijo) | Calculo por zona, exenciones, redondeo |
| Envios y fulfillment | Tarifas, etiquetas, tracking, estados | No | Tarifas, metodos, tracking, integracion couriers |
| Devoluciones y reembolsos | RMA, reembolsos parciales, notas | No | Flujos de devolucion y reembolso |
| Clientes | Cuentas, direcciones, segmentacion | Parcial (auth + perfil) | Segmentacion, multiples direcciones, notas |
| Marketing | Descuentos, gift cards, email, abandoned cart | Parcial (descuentos) | Gift cards, email campaigns, abandono |
| Analitica | Dashboard de ventas y cohortes | No (stats hardcode) | KPIs reales, reportes |
| Contenido/SEO | Blog, paginas, metadatos, sitemap | Parcial (pages estaticas) | CMS, blog, SEO dinamico |
| Canales | Social, marketplaces, POS | No | Integraciones externas |
| Apps/Integraciones | App store, ERP, contabilidad | No | Integraciones via API |

## Funciones faltantes para desplegar (minimo viable)
- Unificar flujo de carrito y checkout en toda la app.
- Corregir rutas incoherentes y links a paginas inexistentes.
- Ajustar textos/encoding para mostrar espanol correcto.
- Configurar pagos: mantener transferencia con validacion o integrar pasarela.
- Definir envios y costos (aunque sean fijos al inicio).
- Completar paginas legales: terminos, privacidad, devoluciones.
- Configurar dominio, SSL, variables de entorno, Resend y almacenamiento.
- Cargar catalogo definitivo y probar compra end-to-end.

## Roadmap sugerido para paridad Shopify (fases)
- Fase 1: pagos con tarjeta, calculo de impuestos, envios basicos, tracking.
- Fase 2: variantes, colecciones, gift cards, marketing basico.
- Fase 3: analitica avanzada, multi ubicacion, integraciones y multi tienda.
