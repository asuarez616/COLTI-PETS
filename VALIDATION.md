# Estado de verificación — COLTI V1

## Actualización — Fase 20.0 (2 de octubre de 2026)

Correcciones localizadas de catálogo, idioma, eyebrows, lettering, orden móvil y confirmación. **113 unitarias, 54 SQL y 68 E2E aprobadas**, TypeScript/build correctos. 28 capturas y ocho exportaciones en artifacts/phase-20. [Informe completo](audits/COLTI-phase-20-ui-corrections-2026-10-02.md). Se mantienen los contrastes pendientes y límites de hardware/backend anteriores. Trabajo detenido para revisión manual; no se inicia ninguna fase posterior.

## Actualización — Bloque E (2 de octubre de 2026)

Fases 17–19 completadas: carga inicial medida -81.1% desktop y -37.5% móvil, assets lossless/responsive, seis viewports y accesibilidad de teclado/semántica. **111 unitarias, 54 comprobaciones SQL y 48 E2E aprobadas**, TypeScript/build correctos. Tres combinaciones de contraste requieren revisión visual; no se declara WCAG. Chrome simulado no sustituye Safari/iPad/teclado virtual/screen reader reales. [Informe y evidencias](audits/COLTI-block-E-performance-responsive-accessibility-2026-10-02.md). No se continúa a fases posteriores; Supabase alojado y publicación siguen pendientes.

## Actualización — Bloque D (2 de octubre de 2026)

Repositorios desacoplados, validación modular SQL/Edge, errores seguros y recuperación de confirmaciones implementados. Estado actual: **107 pruebas unitarias, 54 comprobaciones SQL y 38 pruebas Chrome aprobadas**, TypeScript/build correctos. El caso commit → respuesta perdida → Retry produce un solo pedido; refresh recupera la confirmación. Detalles y límites en [revisión del Bloque D](audits/COLTI-block-D-backend-review-2026-10-02.md). La migración y Edge Function siguen pendientes de despliegue/verificación en Supabase alojado por falta de entorno conectado. Los apartados inferiores conservan el registro histórico de V1.

Actualización de tipografías: las 36 opciones ahora usan archivos reales con correspondencia exacta de `hoja.css`, comprobada con FontFace en Chrome; preview dinámico y exportaciones usan el mismo tratamiento de mayúsculas/adornos. Se incorporó migración de presentación y seed para Supabase. La fuente 9 carga desde TTF original y la 33 desde una copia con encabezado reparado, sin modificar glifos. El estado placeholder descrito abajo corresponde a la entrega inicial y a pedidos históricos; ya no es el catálogo local actual. La suite de navegador incorpora una sexta prueba de carga y previews de las 36 fuentes.

## Implementado

Recorrido de una pregunta por paso; tabla exacta de tallas/ancho; dos imágenes de prueba; catálogo separado con compatibilidades; tres tipos de collar y dos placas; texto/personalización/archivos; 36 fuentes placeholder numeradas; carga dinámica de fuentes reales; varios collares y edición; validación y recuperación; snapshots, numeración transaccional e idempotencia; JPG/PDF; panel dueño con estados; Supabase migraciones/RPC/RLS/Storage/función de adjuntos; build estático con hash routing; configuración y deploy manual de Pages.

## Pruebas ejecutadas

- TypeScript: sin errores.
- Build Vite: generado correctamente en `dist/`, PDF cargado bajo demanda.
- Instalación reproducible: `pnpm install --offline --frozen-lockfile` terminó sin errores; únicamente esbuild tiene permiso para ejecutar su postinstall.
- 6 pruebas unitarias: valores exactos, parejas talla/ancho, teléfonos internacionales, cambio de talla y diseño, archivo obligatorio para foto y edición independiente de varios collares.
- 5 pruebas en Chrome headless: flujo con dos collares y edición, archivo de imagen, confirmación demo sin duplicado, JPG/PDF; validación/recarga de borrador/tabla de tallas; escritorio; catálogo vacío controlado por datos y reintento de imagen; documentos largos (8 páginas) y carga real de fuente de sistema exclusivamente de prueba, sin asociarla a la lámina 1–36.
- 35 comprobaciones en PostgreSQL embebido PGlite: migración/seed, 12 parejas y 36 fuentes, primer número 0001, 10000 sin truncamiento, rollback de orden inválida, reintentos y conflicto de clave, lectura RLS restringida, denegación de edición y elevación, pertenencia/borrador/ítem de adjuntos, estados de archivos, acceso de dueña y transiciones/concurrencia optimista.
- Revisión visual de pantallas a 320/360/1440 px, JPG y páginas primera/última de exportación larga. Sin desbordamiento horizontal en pruebas. Los PDF usan las mismas páginas rasterizadas que el JPG.
- Build adicional con base `/colti/` servido estáticamente: assets correctos, ruta hash del panel y recarga probados en Chrome a 390 px sin errores de aplicación.

Artefactos locales ignorados por Git: `artifacts/desktop-start.png`, `mobile-size.png`, `mobile-order.png`, `demo-order.pdf`, `demo-order-01.jpg`, `long-export-first.png`, `long-export-last.png`.

## Lo que NO está validado todavía

No se proporcionaron URL/clave pública del proyecto Supabase, cuenta de dueña, repo ni dominio. Por ello no se aplicaron migraciones ni se desplegó la función en un backend alojado; la vista actual es una demo local explícita. PGlite usa claims/tablas Auth/Storage de prueba y no equivale a Supabase conectado.

Pendiente al conectar Supabase: ejecutar `scripts/test-backend.mjs` en proyecto desechable para Auth/RLS/RPC y concurrencia multiconexión; comprobar upload real/firma inválida/límites/lectura firmada entre usuarios, CORS y función Edge; verificar login de dueña y transición en navegador con backend real. No se afirma que estas comprobaciones alojadas hayan pasado.

Dominio y publicación pendientes. Fuentes originales/lámina y reglas comerciales siguen como TODO no bloqueante de la especificación; no fueron sustituidas por reglas inventadas. La compatibilidad de los fixtures no es disponibilidad comercial aprobada.

## Reproducir

```sh
pnpm install
pnpm test
node scripts/test-sql-local.mjs
pnpm test:e2e
pnpm build
```

E2E usa Chrome instalado. README documenta entorno, claves públicas, migraciones, seeds, función y acceso de dueña. La vista local `node scripts/serve-preview.mjs` sirve únicamente `dist/` en 127.0.0.1:4173; no es una publicación externa.
