# COLTI — Bloque D, fases 12–16

Fecha: 2 de octubre de 2026.

## Resultado y alcance

Implementación local y verificación completadas. Se mantiene Supabase como infraestructura; no se rediseña el configurador. La migración y la función Edge están preparadas, pero **no están desplegadas ni verificadas en Supabase alojado**: no hay URL/credenciales de un proyecto de prueba conectado.

## Fase 12 — Repositories y aplicación

`src/data/backend.ts` conserva la interfaz de integración y compone servicios. Su implementación anterior se trasladó y evolucionó en `src/infrastructure/supabaseRepositories.ts`, sin mantener una segunda copia. Los contratos `CatalogRepository`, `OrderRepository`, `AttachmentRepository` y `AuthRepository` están en `src/application/repositories.ts` y solo utilizan tipos del dominio. `services.ts` coordina operaciones y normaliza errores.

React y el dominio no importan el SDK de Supabase. Producción utiliza servicios para autenticación, consulta y cambios de estado. Las consultas, RPC, Storage y sesiones del proveedor quedan en infraestructura. La demo usa los mismos contratos y ahora serializa confirmaciones concurrentes y comprueba la firma del contenido.

## Fase 13 — Validación y seguridad

La migración `202610020002_backend_contract.sql` valida antes de crear pedidos:

- Enums de collar, placa y personalización; número de fuente y anchos.
- Decoración permitida únicamente para la personalización correspondiente.
- Information icons conocidos, únicos y vinculados a datos existentes.
- Categorías extra conocidas, únicas y con tipos y límites correctos.
- Email, texto, cantidades y selección exacta de forma/tamaño/dimensiones.
- Adjuntos obligatorios para Drawing/Photo, con pertenencia a usuario, borrador e ítem, y propósito coincidente. Un adjunto Photo usado para Drawing se rechaza.
- Inicio de upload restringido a Drawing/Photo, MIME, tamaño y nombre válidos.

Se conservan el escritor transaccional, su hash de idempotencia, bloqueo, snapshots, numeración, RLS, ownership, bucket privado y URLs firmadas. Los escritores internos y validadores no son ejecutables por anon/authenticated. La función Edge devuelve códigos públicos permitidos, sin exponer mensajes de base de datos.

## Fase 14 — SQL modular y paridad

La migración envuelve una vez el escritor existente y extrae validadores pequeños; no copia toda la función de confirmación. Las futuras reglas pueden evolucionar en esos validadores. La ruta de reintento de un pedido existente mantiene el hash original y permite recuperar una compra aunque después se desactive su catálogo.

Crown permanece en el inventario histórico para conservar referencias, pero está inactivo y no se acepta para pedidos nuevos. No afecta Crown como decoración del nombre, que es un concepto diferente.

Las pruebas comparan las tablas de tallas/ancho y placas activas con TypeScript, además de decisiones de aceptación/rechazo sobre payloads reales. Los límites de texto SQL cuentan unidades UTF-16 para coincidir con JavaScript, incluidos caracteres fuera del BMP.

## Fase 15 — Errores

`src/application/errors.ts` normaliza network, validation, permission, upload, image, confirmation, conflict y unavailable. Las pantallas muestran mensajes seguros localizados y acciones de reintento. Los diagnósticos del proveedor no llegan al texto del cliente. Un fallo temporal no borra el borrador; un fallo al limpiar un upload tampoco sustituye el error original. El cierre de sesión controla errores sin producir una promesa rechazada sin manejar.

## Fase 16 — Idempotencia y recuperación

Antes de enviar una confirmación se guarda un checkpoint de sesión con clave, ID de borrador, firma SHA-256 del contenido y estado. No contiene otra copia del teléfono, nombre ni textos. Si no puede persistirse, no se envía el pedido.

Ante una respuesta incierta se mantienen el borrador y la misma clave, y se bloquean acciones que cambiarían la solicitud. Retry vuelve a enviar la misma solicitud al contrato de hash del servidor. Un conflicto ofrece recuperación del pedido guardado, sin generar una clave nueva. Los errores de permisos no descartan automáticamente una confirmación pendiente.

Al recargar, primero se consulta la clave existente. Si el servidor guardó el pedido, se muestra la confirmación y se elimina el borrador. Si todavía no existe, se mantiene pendiente para reintentar. Si falla la recuperación, se permite volver a intentarla. Una confirmación ya guardada no se convierte silenciosamente en un pedido nuevo. “Start a new order” inicia explícitamente un borrador nuevo y limpia el checkpoint.

La recuperación es por sesión/pestaña y por el usuario propietario del backend. No se promete recuperación entre dispositivos ni después de borrar el almacenamiento del navegador.

## Evidencia

- TypeScript y build Vite: correctos; `dist/` actualizado.
- 107 pruebas unitarias aprobadas, incluidas 49 de paridad TypeScript/PostgreSQL y 13 de servicios, recuperación y errores.
- 54 comprobaciones PostgreSQL aprobadas: migraciones completas, permisos, RLS, bucket privado, ownership, propósito de archivo, rollback, reintentos, conflicto y snapshots estructurados.
- 38 pruebas Chrome aprobadas: flujo, exportaciones, previews, accordions, fuentes, recuperación y hero estable en desktop/tablet.
- Pérdida simulada de respuesta después del commit → Retry: mismo ID y **un único pedido**.
- Recarga después del commit: recupera la confirmación sin crear otro pedido.
- Pérdida antes del commit → recarga → Retry: mantiene la clave y crea **un único pedido**.
- Doble confirmación concurrente en demo: mismo ID y **un único pedido**.
- Cambio de catálogo tras guardar: el reintento recupera el pedido original.

Un primer recorrido completo tuvo un fallo intermitente de click en el cierre de Photo en tablet horizontal. La prueba aislada y el siguiente recorrido completo pasaron sin modificar el accordion; no se atribuye a ello una regresión corregida de producto.

## Reproducir y desplegar

`pnpm test`, `pnpm test:sql`, `pnpm test:e2e`, `pnpm build`. El workflow de Pages ejecuta también las comprobaciones SQL antes del build.

Aplicar todas las migraciones en orden, ambas semillas y desplegar la función `attachments`. El script `scripts/test-backend.mjs` incorpora los casos nuevos y requiere un proyecto desechable con `COLTI_TEST_PROJECT=true`; no se ha ejecutado contra un servicio alojado.

PGlite ejecuta PostgreSQL real, pero utiliza tablas/claims de Auth y Storage de prueba. Quedan pendientes Auth real, RLS/Storage con usuarios reales, URLs firmadas, CORS, uploads y firma de contenido en la función Edge, login de producción y concurrencia con conexiones independientes en Supabase. No se afirma que esas pruebas alojadas hayan pasado.
