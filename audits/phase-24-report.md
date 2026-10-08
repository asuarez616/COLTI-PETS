# Fase 24 — COLTI Admin / Production V1

## 1. Resultado y antes/después

| Área | Antes | Después |
|---|---|---|
| Pedidos | Production anterior, tres estados | Admin independiente, mismo Order, búsqueda, filtros, páginas de 20, cinco estados y compatibilidad finished |
| Nota | No existía | Nota interna de la orden, guardado explícito y control de versión |
| Catálogo | Drive + compatibilidad | Disponibilidad adicional persistida por diseño/ancho, sin modificar Drive |
| Hero | Manifiesto Drive sincronizado | Mismo manifiesto + active/orden administrativo con revisión |
| Seguridad | Propietario/RLS existentes | Nuevos RPC privados, tablas de configuración sin escrituras públicas, Admin cerrado sin Auth |
| Export | PDF/JPG aprobado | Mismo exportador, sin nota privada |

No se creó una segunda aplicación, entidad de producción ni copia de órdenes. El UI administrativo es una primera versión operativa; no se inició polish ni otros módulos.

## 2. Archivos creados

- `src/domain/admin.ts`, `src/domain/admin.test.ts`
- `src/application/admin.ts`, `src/application/admin.test.ts`
- `src/infrastructure/admin.ts`
- `src/data/adminBackend.ts`, `src/data/heroBackend.ts`
- `src/admin/Admin.tsx`, `src/admin/Collar.tsx`, `src/admin/admin.css`
- `supabase/migrations/202610030004_admin.sql`
- `scripts/test-admin-sql.mjs`
- `tests/admin.spec.ts`, `tests/admin-ui.spec.ts`, `tests/admin-hero.spec.ts`, `tests/fixtures/admin-backend.js`
- `docs/admin.md`, `audits/phase-24-audit.md`, este informe y artefactos de verificación.

## 3. Archivos modificados

`src/main.tsx` (rama Admin lazy), `src/domain/model.ts` y `validation.ts` (estados adicionales compatibles), `src/infrastructure/supabaseRepositories.ts` (cliente compartido y disponibilidad al cargar catálogo), `src/application/errors.ts` (error de disponibilidad), `src/i18n/index.ts` (nombres Delivered/Cancelled), `src/EditorialCarousel.tsx` (fuente/configuración semántica). No se editaron sources.

## 4. Migración

Solo se añadió `202610030004_admin.sql`. Amplía estados sin reescribir finished, añade nota e índice de listado, tablas `catalog_availability` y `hero_configuration`, RLS y RPCs privados. Envuelve la confirmación existente; conserva el hash y la recuperación previos. No modifica migrations antiguas ni crea otra tabla de pedidos.

## 5–7. Contratos, repositorios y operaciones

Domain centraliza estados/transiciones, disponibilidad combinada y configuración Hero. Application ofrece operaciones explícitas sobre `AdminRepository` y `HeroImageSource`, con autorización y errores tipados. La implementación Supabase transforma respuestas y normaliza snapshots/URLs. Las composiciones en data separan React del proveedor.

Operaciones: authorized, list, detail, status, note, catalog, availability, hero y saveHero. UI no ejecuta consultas Supabase ni conoce IDs de carpetas Drive. No se introdujeron gestores de estado, buses, DI frameworks ni repositorios genéricos.

## 8. Rutas

`/admin` redirige a `/admin/orders`. Implementadas `/admin/orders`, `/admin/orders/:id`, `/admin/catalog`, `/admin/hero`, `/admin/login`. Shell y navegación independientes: Orders, Catalog, Hero. Se conserva la ruta Production anterior por compatibilidad; la cabecera pública continúa sin enlace administrativo.

## 9. Seguridad

Admin exige sesión no anónima y el propietario configurado. Cada operación administrativa en SQL vuelve a verificar `is_owner()`. Las tablas nuevas permiten lectura de configuración pública necesaria y deniegan INSERT/UPDATE/DELETE a anon/authenticated. Escrituras solamente por RPC de propietario, con versiones esperadas.

La nota nunca entra en `order_document`/`find_order`. Las órdenes ajenas siguen protegidas por RLS. Attachments mantienen las políticas Storage y signed URLs existentes. No se añadieron secretos ni service role al navegador. El adaptador de UI está exclusivamente bajo tests, servido mediante interceptación Playwright; no existe bypass demo del Admin en producción.

## 10. Orders

Consulta los mismos registros de confirmación. Búsqueda ID/cliente/teléfono/mascota normalizada en servidor, filtro de estado, listado paginado y manejo de carga/vacío/error/no resultados. Detalle reutiliza proyecciones, fuente real, DesignImage y Downloads; omite opcionales vacíos. Referencias tienen carga, error y retry que solicita otra URL firmada.

New → In progress → Ready → Delivered. Cancelled desde estados no terminales; no se borra. finished histórico se presenta como Ready. Status y nota usan updated_at esperado; los conflictos no sobrescriben datos y requieren recargar la versión guardada.

## 11. Catalog availability

Overrides separados por diseño y ancho; ancho 0 = diseño completo. Disponible requiere fuente activa, override de diseño activo, override de ancho activo y compatibilidad original. Sin overrides se conserva el catálogo anterior. El sincronizador Drive no borra overrides.

La confirmación y los toggles bloquean el mismo diseño; la confirmación bloquea varios diseños en orden determinista. El servidor revalida drafts abiertos. Un diseño desactivado informa que debe editarse/elegirse otra alternativa. Las órdenes históricas usan snapshots. Un retry exacto de una orden ya registrada continúa recuperándola después de desactivar un producto.

## 12. Hero

HeroImageSource consume el manifiesto sincronizado de la carpeta independiente. Supabase guarda únicamente IDs, active y orden, con revisión optimista. Nuevas imágenes sincronizadas aparecen al final, activas; archivos ausentes se omiten. Admin ofrece controles accesibles ↑/↓ y guardado explícito. No hay upload, edición, borrado ni CMS.

El público carga la configuración antes de elegir fotografías; conserva el fallback local si la lectura falla. Todas desactivadas deja el panel/textos sin fotografía. No cambian crop aprobado, geometría, overlays, copy, crossfade ni comportamiento móvil.

## 13–14. Alcance público y preservación visual

Cambios públicos funcionales limitados a disponibilidad del catálogo/confirmación y configuración Hero. El cliente soporta además los nuevos estados del mismo Order. No se cambiaron reglas de talla, navegación/progress del configurador, TagPreview, fuentes, siluetas, assets, UI de confirmación ni exportadores.

El CSS público generado mantiene `index-D70kjJbt.css` (67.34 KB), igual que antes. El CSS Admin es un chunk separado y sus reglas se limitan a `.admin`. No se actualizaron snapshots. Las pruebas de geometría del hero desktop/tablet y ocultamiento móvil pasan al cambiar imágenes activas/orden.

## 15–16. Verificación

Ejecución final completa: **145 casos, 136 pasaron, 9 fallaron, 0 omitidos, 0 flaky**, 360.4 segundos. Los nueve fallos pertenecen exclusivamente a `phase-22.spec.ts`: approved states, Spanish key states y font failure, en desktop/tablet/mobile. Informe bruto: `artifacts/phase-24-final-e2e.json`; log: `artifacts/phase-24-final-e2e.log`.

| Verificación | Resultado |
|---|---|
| Unitarias Domain/Application y previas | 143/143 |
| Integración sync Drive | 4/4 |
| PostgreSQL previo | 54/54 |
| PostgreSQL Admin / RLS | 46/46 |
| E2E sin los 16 casos de suites visuales | 129/129 |
| Visual: Fase 22 + layout-stability | 7/16 pasan; 9 fallos de snapshots antiguos |
| Suite completa E2E + visual | 136/145 pasan |
| Typecheck | Pasa |
| Production build | Pasa |

Admin UI 4/4, acceso privado 2/2 y hero dinámico 3/3 están incluidos en los 129 E2E. La ejecución adicional instrumentada de Admin UI también pasó 4/4 sin page errors ni warnings de React. Estabilidad/fallback pasó 5/5. No se suman ejecuciones repetidas como casos únicos.

Unitarias: 143/143 (121 previas + 22 de Domain/Application Admin). PostgreSQL anterior: 54/54. PostgreSQL Admin: 46/46. Integración del sincronizador Drive: 4/4. Typecheck y build pasan.

La cobertura SQL comprueba permisos anon/no propietario, búsqueda y filtros, multi-collar, unicidad/retry, transiciones inválidas, cancelación sin borrado, nota privada y CAS, disponibilidad/revalidación, histórico y configuración Hero. UI comprueba guardado/refresh, fuentes, opcionales, PDF/JPG, nota ausente del texto dibujado del export, configuración y responsive con imágenes fallidas. No se afirma equivalencia de Auth/Storage hosted con el entorno local.

## 17. Deuda / referencias visuales

Las referencias Fase 22 preceden modificaciones aprobadas de copy, retirada del enlace Production, espaciados y nuevo contenido fotográfico. Esto ya estaba documentado en `translation-copy-2026-10-03.md`, antes de esta fase. La reproducción desktop ES muestra diferencias en cabecera/progress/copy del hero; catálogo y geometría permanecen. Evidencia conservada en `artifacts/phase-24-visual/`.

La suite visual no está verde y no se declara completado ese criterio. Requiere revisar/aceptar referencias de los cambios aprobados en una fase explícita; no se ocultaron fallos actualizando imágenes. Las pruebas independientes de geometría y estabilidad sí pasan.

Drive continúa con sincronización de servidor/build, no escucha en tiempo real ni tiene credenciales de Drive en el cliente. Nuevos assets requieren sincronizar/publicar antes de aparecer en este despliegue. Production anterior conserva su flujo legacy; la gestión nueva debe hacerse en Admin.

## 18–19. Entorno y staging

No hay instancia Supabase/propietario real configurado en este entorno; no se aplicaron cambios remotos ni se inventaron credenciales. Por eso el Admin real local presenta acceso cerrado. Screenshots/UI tests usan un adaptador de pruebas identificado.

Antes de activar: aplicar migraciones, configurar URL/publishable key, crear usuario Auth real y vincular production_owner, publicar con fallback SPA para rutas /admin. Verificar en staging login/renovación, pedido real → Admin exactamente una vez, permisos REST/RPC, dos conexiones concurrentes, signed URLs/Storage y sync/publicación. Instrucciones en `docs/admin.md`.

## 20. Capturas y documentos

Capturas revisadas con datos de prueba:

- Orders: `artifacts/admin/orders.png`
- Order detail: `artifacts/admin/order-detail.png`
- Catalog: `artifacts/admin/catalog.png`
- Hero: `artifacts/admin/hero.png`
- Exports descargados desde Admin: `artifacts/admin/order.pdf`, `artifacts/admin/order.jpg`

No se inició polish, inventory, shipping, analytics ni otra fase.
