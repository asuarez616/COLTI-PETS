# COLTI — Fase 24: sincronización y UX operativa

Fecha: 5 de octubre de 2026. Este reporte sustituye el checkpoint anterior; distingue funcionamiento local verificado de preparación para publicación permanente.

## Antes / después

| Área | Antes | Resultado |
|---|---|---|
| Drive | Sincronización manual y hero incluido en el build | Worker del servidor cada 30 segundos; catálogo y manifest del hero se publican sin reconstruir la web |
| Datos abiertos | Eventos podían perderse y vistas quedar atrasadas | Invalidación/refetch, reconciliación periódica, foco/reconexión y actualización manual; se conserva la última respuesta válida |
| Imágenes | Cambios de archivo podían reutilizar URL | Identidad estable por archivo y rutas versionadas; imágenes históricas retenidas; fallo de carpeta aborta la actualización |
| Catálogo | Diseños repetidos por talla y cambios individuales | Una tarjeta por diseño, Woven/Printed, estado, talla, ancho, búsqueda y operaciones masivas confirmadas y atómicas |
| Pedidos | Detalles en otra página y tarjetas variables | Tres carriles de producción en All, filtros de estado, History separado, tarjetas acotadas y detalle modal compartido |
| Estados | Avance únicamente hacia adelante | New ↔ In progress ↔ Ready; Delivered y Cancelled terminales, con motivo de cancelación opcional |
| Hero admin | Lista única y edición poco clara | Active/Inactive, posición accesible, drag, reactivación al final y Save/Discard explícitos |
| Login | Formulario básico | Diseño COLTI con logo, paleta y tipografía existentes; mostrar contraseña, autocomplete y adaptación desktop/tablet/mobile |

## Evidencia real

- Supabase `fumscyebzupuqylslsdp`, propietario existente. La nueva migración `202610050001_admin_operations.sql` fue aplicada mediante el editor SQL y devolvió éxito. Bootstrap de proyectos nuevos actualizado y probado.
- Catálogo actual: 265 diseños (71 estampados, 98 tejidos grandes, 96 tejidos pequeños, S/SM vacío preparado). La incorporación real del diseño adicional se observó sin reconstrucción/F5. Hero: 6 archivos actuales de Drive.
- Worker real conectado: timestamps de sincronización avanzaron automáticamente. Ejecución cacheada de sincronización terminó correctamente en Windows/Node 24, tras corregir salida prematura del proceso.
- Pedidos reales QA `COLTI-US-0003`, `0004`, `0005`: 1/5/10 collares, confirmaciones concurrentes/repetidas devolvieron el mismo ID; recuperación e aislamiento del cliente comprobados. Se cancelaron después de las pruebas y permanecen identificados en History. `COLTI-US-0002` (Toya) conservó su estado y datos.
- Cancelación con motivo y sin motivo guardada y persistente después de refresh. Detalle de 0003 muestra el motivo interno. Cambio real In progress → New comprobado.
- Operación masiva acotada a CH-24-1: desactivación/restauración guardada, anchos conservados.
- Hero 0.png desactivado y restaurado con su posición inicial; carrusel público abierto cambió 6 → 5 → 6 sin recargar. Configuración final restaurada.
- Capturas: `orders-all-live.png`, `orders-new-live.png`, `order-modal-live.png`, `cancellation-live.png`, `history-live.png`; login responsive en `../../artifacts/admin/login-{1440,834,390}.png`.

## Validación

- Typecheck y build de producción: PASS. CSS público conserva `index-D70kjJbt.css`; estilos nuevos limitados al admin.
- Unitarias: 157/157 PASS.
- Drive/OAuth/worker: 13/13 PASS; lectura solamente, PKCE/state, cifrado de token, controles de propietario/origen, concurrencia y recuperación de errores.
- PostgreSQL local real/WASM: 84/84 PASS; rollback, idempotencia, RLS, uploads, estados, lote y pedidos de 1/5/10 collares. No equivale por sí solo a probar infraestructura hosted completa; la evidencia real anterior complementa estas pruebas.
- E2E final admin y vecinos: 32/32 PASS (modal, cancelación, filtros, catálogo, hero, login, draft, uploads, exports, espejo local y geometría del hero).
- E2E adicional: 15/15 PASS (flujo integral EN/ES, Drive, 36 fonts, PDF, fallbacks y recovery). Total final: 47/47 pruebas de navegador funcionales.
- Los tres fallos de la primera ejecución vecina se resolvieron en las pruebas: fixture mutado necesitaba señal de reconciliación; texto de tarjeta había cambiado con UX aprobada; test estático apuntaba al servidor vivo. Ahora usa build demo y puerto 4177 aislados, sin sobreescribir dist de producción.
- Fase 22 completa: 3 PASS / 9 FAIL. Las comprobaciones de carga Drive/geometría pasaron. Las referencias de pantallas están desactualizadas (incluyen Production y textos aprobados anteriormente); también se observó un timeout de ES mobile. No se actualizaron snapshots ni se afirma que toda la regresión visual esté verde. Geometría/pixel-stability del hero pasó en los cuatro tamaños del test dedicado.
- Credenciales privadas no aparecen en archivos publicados; variables privadas y tokens permanecen fuera de dist y en rutas ignoradas. La clave del servidor no recibió permisos generales adicionales sobre tablas.

## Estructura y límites operativos

UI llama Application; reglas y edición del hero están en Domain; batch usa Repository y RPC transaccional; Drive permanece en Infrastructure/scripts. El detalle modal reutiliza el mismo detalle existente, sin duplicar contratos. No se cambiaron geometría pública, fonts, payload de pedido ni reglas de talla.

El servidor local actualizado está en http://127.0.0.1:4176/admin/orders. La sincronización automática corre mientras ese servidor está encendido. Para reiniciar: `node scripts/serve-admin.mjs` desde la raíz con la configuración local existente. Esto no es todavía un despliegue permanente: al publicar se necesita proceso supervisado, HTTPS, origen y callback del dominio real. No se agregó facturación.

Pendiente externo: Google OAuth sigue en Testing; su refresh token caduca a los 7 días. Falta dominio/configuración pública para preparar el modo de uso continuo; se consultó al propietario, sin inventar dominio ni ampliar accesos. Documentación: https://developers.google.com/identity/protocols/oauth2 . Si expira, el admin informa reconexión y conserva los datos anteriores.

Deuda documentada: actualizar referencias visuales con aprobación del estado actual; revisar timeout ES mobile; verificar en hosting definitivo cookies/proxy/HTTPS y reinicios; prueba de archivo nuevo de hero cubierta con fixtures (no se subieron archivos nuevos a Drive durante QA). Imágenes históricas se retienen deliberadamente; su limpieza requiere política futura que respete pedidos guardados.
