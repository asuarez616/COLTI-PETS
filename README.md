# COLTI Configurator V1

Fase 20.0: [correcciones UI y regresión](audits/COLTI-phase-20-ui-corrections-2026-10-02.md), con causas raíz, datos estructurados, fuentes reales y capturas reproducibles. Revisión manual pendiente antes de continuar.

Bloque E (fases 17–19): [informe de rendimiento, responsive y accesibilidad](audits/COLTI-block-E-performance-responsive-accessibility-2026-10-02.md). Comparación reproducible: `node scripts/measure-performance.mjs` sobre la compilación local y `node scripts/report-block-e.mjs`; el JSON anterior conserva la referencia del Bloque D. Generación de assets: `scripts/optimize-images.py` (Pillow 12.3) y `scripts/optimize-fonts.py` (fontTools 4.66.1/Brotli 1.2), dependencias de generación. Las variantes remotas se usan solo tras publicar todas y marcar `responsive-v1`; el upload no se ejecutó en Supabase. Fuentes remotas antiguas mantienen sus rutas originales.

Implementación de `COLTI_CONFIGURATOR_SPEC.md`: React/TypeScript/Vite, Supabase y exportación JPG/PDF. Sin precios, pagos, CRM, WhatsApp ni recomendación automática de talla.

## Probar localmente

Requiere Node 22.12+ y pnpm 11.19 (fijado en packageManager). Ejecutar desde esta carpeta:

```sh
pnpm install
pnpm dev
```

Abrir http://127.0.0.1:5173. Sin configuración Supabase aparece **Demo local**: permite probar el recorrido y exportaciones, conserva órdenes solo en sessionStorage y fotos en IndexedDB. Sus códigos comienzan por `DEMO-COLTI-US-`; no son pedidos reales ni un panel privado. La demo no simula autenticación/seguridad de producción. No usarla para recibir pedidos. `VITE_ALLOW_DEMO=false` deshabilita su confirmación.

## Conectar Supabase

1. Crear un proyecto Supabase. Aplicar **todas** las migraciones de `supabase/migrations/` en orden de nombre, incluida `202610020002_backend_contract.sql`, y después ambas semillas (`seed.sql` y `seed-fonts.sql`). Preferir Supabase CLI (`supabase link`, `supabase db push`, y ejecutar las semillas). Para entorno local con CLI y Docker: `supabase start` y `supabase db reset` aplican config/migraciones/seed.
2. En Auth habilitar Anonymous Sign-Ins. Deshabilitar registro email público; la cuenta dueña se crea desde administración Auth. Aplicar los límites de frecuencia de Auth del proyecto. La app no expone una pantalla de registro.
3. Crear la cuenta de la dueña con email/contraseña desde Auth y copiar su UUID. En SQL Editor insertar **solo** ese UUID:

```sql
insert into public.production_owner(singleton,user_id)
values (true,'UUID_REAL_DE_LA_DUEÑA');
```

4. Subir `reference-assets/CH-17-1.png` y `reference-assets/design-test-02.png` al bucket público `catalog-images`, conservando estos nombres. Alternativa: `pnpm seed:assets` con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` como variables del terminal. El script no escribe la clave. Nunca poner service-role en `.env` del frontend ni en una variable VITE_.
5. Desplegar la función: `supabase functions deploy attachments --no-verify-jwt`. La función verifica cada JWT mediante `auth.getUser`; no es una función pública sin autorización. Configurar su secreto `ALLOWED_ORIGINS` con URLs exactas separadas por coma (ej. localhost y sitio final). SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY son secretos de runtime de la función, nunca públicos.
6. Copiar `.env.example` a `.env.local` y rellenar `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. Las claves publishable/anon son públicas; RLS/RPC restringen operaciones. Reiniciar Vite tras cambiar variables.
7. Configurar Site URL y redirects de Auth para entorno local y sitio publicado. Mantener adjuntos privados. Verificar con `pnpm test:backend` contra un proyecto de pruebas antes de recibir pedidos.

El frontend no cae a demo cuando un backend configurado falla. Muestra error/reintento y conserva borrador. Catálogo y fuentes vienen de tablas Supabase; las imágenes locales son solo para demo. Los snapshots permiten reproducir los pedidos incluso si se desactiva el catálogo; no borrar assets o fuentes referenciados.

## Panel de producción

`/#/production`: login de la dueña, listado de 20 pedidos por página, filtro, detalle/adjuntos/exportaciones, avance Nuevo → En proceso → Terminado. Solo el UUID en `production_owner` tiene acceso. La sesión anónima no puede leer tablas de pedidos; `find_order` devuelve únicamente el resultado propio para una clave de idempotencia conocida. No hay CRUD público de pedidos ni registro de administradores.

## Datos de prueba y TODO

- Compatibilidades de ambos diseños: todas las parejas de talla/ancho válidas, **solo fixtures**. CH-17-1 es tejido de prueba; TEST-PRINTED-02 y su tipo estampado son provisionales. No representan disponibilidad comercial aprobada.
- 36 fuentes reales incorporadas desde los archivos aportados `Letras-2025/fuentes.css`, `hoja.css` y carpeta `fuentes`. Numeración, mayúsculas y adorno de Channel provienen de esa referencia. Manifest único en `src/catalog/font-manifest.json`; assets locales en `public/fonts/plates`. La fuente 9 usa su TTF original; la 33 conserva los glifos originales con su encabezado OS/2 corregido. La [especificación OpenType de Microsoft](https://learn.microsoft.com/en-us/typography/opentype/spec/os2) documenta la diferencia entre los formatos v4/v5 que causaba su rechazo. `scripts/repair-font-33.mjs` reproduce esa corrección sin alterar nombres, contornos ni métricas de glifos.
- Para Supabase: aplicar también migración `202610010002_font_presentation.sql`; ejecutar `node scripts/upload-fonts.mjs` con secretos solo en terminal; después ejecutar `supabase/seed-fonts.sql`. En local, `supabase db reset` aplica ambas semillas automáticamente. No se subieron archivos a un proyecto remoto sin conexión configurada. Snapshot conserva estilo/número/versión; pedidos previos con placeholder conservan su estado histórico.
- Pendientes comerciales: catálogo real/Drive, compatibilidades, anticaída por ancho, reglas de placa/decoración, pulgadas/libras y su redondeo. No bloquean prototipo.
- Cuenta/proyecto Supabase, dominio y repositorio reales son configuración pendiente. Un backend no se considera probado por funcionar la demo.

## Límites técnicos

20 collares/orden; 10 nuevas órdenes por usuario/hora; payload de ítems ≤200 KB; nombre cliente/mascota ≤200 caracteres; teléfono 7–32 caracteres con mínimo 7 dígitos; texto extra/instrucciones ≤2000 caracteres. Adjuntos JPEG/PNG/WebP ≤10 MB, máximo 3 por collar, 30 intentos por usuario/hora. Son límites técnicos ajustables, no reglas de grabado.

Uploads: registro pending por RPC, upload restringido por RLS sin overwrite, verificación servidor de bytes/tamaño/firma MIME, luego ready. Confirmación vincula únicamente ready del usuario/borrador/ítem correcto dentro de una transacción. URLs de lectura firmadas por 60 segundos. El cliente nunca decide el estado ready. Los archivos descartados se eliminan vía función; no existe DELETE público. Considerar CAPTCHA de Auth y ajustar límites para exposición pública según configuración real.

Borrador JSON en sessionStorage, sin archivos binarios; adjuntos demo en IndexedDB. La demo no es una bóveda de datos: para limpiar sus fotos, borrar los datos del sitio en el navegador. Los adjuntos reales confirmados permanecen en Storage. Política definitiva de retención es TODO; preparar limpieza técnica de borradores huérfanos tras 7 días con `scripts/cleanup-drafts.mjs`, que excluye archivos vinculados. No programar borrado comercial de órdenes.

## Exportaciones

JPG/PDF se regeneran desde snapshot confirmado. PDF multipágina y JPG numerados; cada página incluye código/cliente/fecha. Texto largo se envuelve; no se incluye URL firmada/token en documentos. La foto se incluye si puede leerse; siempre quedan nombre/tipo/ID del archivo y acceso desde panel. La generación fallida no crea otro pedido. Los documentos PDF usan páginas rasterizadas para mantener las letras y previews del resumen; no son PDFs de texto seleccionable.

## GitHub Pages y dominio

```sh
pnpm build
pnpm preview
```

Publicar `dist/` con GitHub Pages. Usar `VITE_BASE_PATH=/nombre-del-repo/` para Pages de proyecto o `/` para dominio propio. Rutas hash evitan 404 al refrescar el panel. El workflow incluido despliega **manualmente** con workflow_dispatch; no se publica automáticamente. Configurar GitHub Pages como GitHub Actions y variables públicas del repositorio para Supabase/base/locale. Agregar `public/CNAME` solo cuando la dueña indique el dominio real; apuntar DNS según GitHub Pages y activar HTTPS. Añadir origen final a ALLOWED_ORIGINS y Auth. No se requiere servidor Node en Pages.

## Verificación

```sh
pnpm test
pnpm test:e2e
pnpm build
```

E2E usa Chrome instalado en modo headless (`channel: chrome`). Para usar Chromium de Playwright en otra máquina, quitar `channel` de la configuración e instalarlo con `pnpm exec playwright install chromium`. Pruebas demo incluyen dos collares, edición, archivo, exportaciones, doble submit, validación, recarga de borrador y anchos de 320/360/1440 px. Artefactos en `artifacts/` (ignorados por Git).

`pnpm test:sql` ejecuta todas las migraciones y 54 comprobaciones sobre PostgreSQL embebido (PGlite), con tablas Auth/Storage y claims de prueba. Comprueba transacciones, RLS, validación y autorización SQL reales, pero no sustituye las pruebas de Supabase alojado, Edge Functions, Auth, Storage, CORS ni concurrencia con múltiples conexiones. En ese harness se sustituye únicamente la extensión pgcrypto por SHA-256 nativo, manteniendo el hash real del payload. `pnpm test` incluye además 49 pruebas de paridad entre el dominio TypeScript y PostgreSQL.

Pruebas del backend real, en un proyecto desechable con semillas y Auth configurado:

```sh
# Configurar SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY y COLTI_TEST_PROJECT=true.
pnpm test:backend
```

Opcionales `COLTI_OWNER_EMAIL` y `COLTI_OWNER_PASSWORD` para probar transiciones autorizadas. No registrar credenciales. El script crea usuarios anónimos y pedidos de prueba; no apuntarlo al proyecto comercial. Para uploads, comprobar adicionalmente contra la función desplegada un archivo válido, contenido falsificado, exceso de tamaño, escritura fuera de ruta y acceso entre usuarios. Ver `VALIDATION.md` para evidencia y pendientes de esta entrega.

Referencias técnicas: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [funciones Postgres](https://supabase.com/docs/guides/database/functions), [Auth anónimo](https://supabase.com/docs/guides/auth/auth-anonymous), [Storage RLS](https://supabase.com/docs/guides/storage/security/access-control).


Auditoría de estabilización final: [FASE 21 — testing integral, antes/después y deuda](audits/COLTI-phase-21-integral-audit-2026-10-03.md).

Referencias visuales: [FASE 22 — pantallas congeladas y ejecución](audits/COLTI-phase-22-visual-regression-2026-10-03.md). Comparar con `npm run test:visual`.

Limpieza CSS controlada: [FASE 23 — tokens, equivalencia y deuda](audits/COLTI-phase-23-css-design-tokens-2026-10-03.md). Valores y breakpoints: [design tokens](docs/design-tokens.md).
