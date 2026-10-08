# FASE 21 — Testing integral y auditoría estructural

Fecha: 3 de octubre de 2026. Proyecto COLTI PETS.

## Resultado y alcance

La auditoría se ejecutó antes de modificar el producto. Se preservaron arquitectura, contratos, reglas comerciales, navegación, fuentes, estilos responsive y geometría del hero. Se corrigieron tres defectos reproducibles con cambios pequeños. No se hicieron refactors.

Esta revisión valida el configurador local, demo y las migraciones en PostgreSQL aislado. **No certifica el entorno Supabase alojado ni una sincronización autenticada de Drive**, porque no hay credenciales configuradas. El hero todavía es local.

## Antes y después

| Verificación | Antes | Después |
|---|---:|---:|
| Unitarias | 117/118 | 118/118 |
| E2E históricas | 27/111 | 120/120 (matriz ampliada) |
| Nuevas reproducciones Family/Drive | 3/4 | 4/4 |
| Nuevas comprobaciones de área segura, cinco modelos | 4/5 | 5/5 |
| PostgreSQL local | 54 correctas | 54 correctas |
| Reglas de sincronización Drive | 4 correctas | 4 correctas |
| Recursos del catálogo | 795 comprobados, 0 fallos | Sin cambios de assets |
| Typecheck y build | Revisados | Correctos |

El primer lote E2E usó un límite diagnóstico de 15 segundos; el cierre usa 45 segundos (la configuración habitual permite 60). La mayoría de los fallos iniciales eran expectativas anteriores a cambios ya aprobados: catálogo de dos fixtures frente a 265 diseños Drive, un paso de ancho para M, etiqueta Small, estado Ready y previews con todas las líneas. Se actualizaron las pruebas para las reglas actuales, **sin adaptar el producto a expectativas obsoletas**.

Las pruebas históricas ahora interceptan exclusivamente el manifiesto Drive para usar sus fixtures explícitos. Las pruebas Drive y las nuevas pruebas EN/ES usan el catálogo real sin esa interceptación. No se presenta la cobertura con fixtures como verificación de Drive.

Resultado E2E final: **120/120 correctas, 0 fallos**, en 4,6 minutos. Resultado dirigido de geometría: **17/17 correctas**.

Se reforzó la prueba de exportación: el evento de descarga se identifica por su extensión y se comprueba la firma binaria (%PDF- y JPEG ffd8ff). Una espera genérica podía capturar otra descarga PDF y guardarla con extensión JPG, produciendo evidencia incorrecta aunque el exportador generara ambos formatos correctamente.

También se eliminó un falso positivo de rasterización del hero: una ejecución presentó diferencias de 1 nivel RGB en solo 7 píxeles de una imagen de 492 × 611, sin movimiento de ningún elemento. La prueba permite como máximo 10 píxeles con delta de canal 1; los límites de geometría e identidad del DOM siguen siendo exactos. No se modificó el hero.

## Defectos reproducidos y correcciones mínimas

### 1. Family contact: faltaba el segundo número

Antes: Additional numbers mostraba una sola caja y obligaba a juntar dos números. La aplicación ya tenía helpers para dos valores y un contrato separado por salto de línea.

Cambio: renderizar dos campos de teléfono, con el segundo opcional, usando los helpers existentes. Se reutiliza el espaciado de contact-fields. No cambia el payload ni la validación.

Protección: dos números independientes, recuperación tras refresh, formato persistido y cambio a Name and number. Se verifica separación vertical mínima.

Archivo: `src/TagExtraDetails.tsx`.

### 2. Hueso: tercera línea recortada en el reverso

Antes: tres iconos de 16 px y su separación requerían más altura que el área de información. El último quedaba aproximadamente 7 px fuera del área segura.

Cambio: ampliar hacia arriba únicamente el área de composición del reverso (top 34% → 26%). No cambia silueta, contorno, tamaño de imagen, frente, nombre ni fuente.

Protección: comprobación de límites pintados para los cinco modelos; hueso mantiene tres líneas y una sola cara posterior.

Archivo: `src/ui/tagPreviewConfig.ts`.

### 3. Anticaída: recorte mínimo con nombre de dos líneas

Antes: con nombre largo, decoración y tres iconos, el contenido al tamaño mínimo sobrepasaba el área en aproximadamente 1 px. El ajuste llegaba a su mínimo sin resolver ese exceso.

Cambio: mantener la separación habitual; solo si la composición todavía excede la altura al mínimo, eliminar el pequeño gap entre filas. El nombre no se redimensiona por este cambio. Los casos normales conservan su separación.

Protección: nombres largos y datos extremos a 390, 834 y 1440 px; se comprueban los límites visuales de texto e iconos. Las medidas usan el contenido pintado, porque scaleX no modifica scrollWidth intrínseco.

Archivo: `src/ui/TagPreview.tsx`.

## Cobertura comprobada

| Área | Evidencia y límites |
|---|---|
| EN/ES | Recorridos completos con catálogo real, dos collares y exportación en ambos idiomas. No se declara traducción exhaustiva de cada texto editorial. |
| Uno y múltiples collares | Agregar, editar, quitar, guardar dos y mostrar cinco pedidos compactos. |
| Back / Continue / progress | Motor unitario, ramas de tallas con uno o dos anchos, selección de modelo y recuperación de pasos antiguos. |
| Refresh / draft | Recuperación válida y corrupta; dos números y selecciones conservados; confirmación recuperada. |
| Tags | Paw, Circle, Bone, Military y Anticaída; frente/reverso, límites de líneas y áreas seguras. |
| Personalización | Decoration, Drawing, Photo y None; independencia del acordeón, exclusividad de medios, una referencia y errores de carga. |
| Fuentes | 36 fuentes reales en modal/build; muestras 1, 9, 17, 18 y 33 en preview, Review, Your Order, Confirmation y Production. Datos inferiores conservan Montserrat. |
| Preview | Comprobaciones geométricas y capturas responsive; se preservan siluetas y nombre. Textos extremos tienen deuda de legibilidad, indicada abajo. |
| PDF / JPG | Descargas de ambos formatos, pedidos múltiples, referencias y fuentes; exports reales EN/ES en artifacts/phase-21. |
| Production | Panel demo, detalles y fuentes/export; restricciones y estados SQL aislados. Sesión de propietario alojada no verificada. |
| Drive catálogo | 265 diseños, cuatro grupos, todas las anchuras válidas, carpetas anidadas/paginación y S/SM vacía. 795 variantes locales respondieron. |
| Fallback de imagen | Fallo forzado, selección conservada, mensaje de recuperación y Retry satisfactorio. |
| Drive hero | **No implementado**: usa cinco imágenes locales. No se modificó su geometría ni sus fuentes. |
| Supabase / demo | Demo recorrido integral; PostgreSQL aislado: rollback, ownership/RLS, retry/conflict y estados. No equivale a prueba del servicio alojado. |
| Uploads | UI/demo y validaciones; ownership y estados SQL. No se probaron Storage/Edge/CORS reales. |
| Idempotencia / recovery | Doble confirmación y recuperación de pedido sin duplicación en demo; transacciones/conflictos en SQL. Concurrencia real pendiente. |
| Regresión visual | Hero geométricamente estable durante interacciones en cuatro tamaños; comparación raster con tolerancia de 1 nivel RGB en un máximo de 10 píxeles; capturas de los modelos y flujo responsive. No hay una baseline visual externa aprobada para toda la aplicación. |

## Auditoría estructural

Se mantuvo el flujo UI → Application → Domain → Repositories → Infrastructure.

El análisis de imports encontró **0 dependencias de proveedor en Domain, 0 en Application y 0 imports Drive en UI**. El manifiesto Drive se consume desde `src/infrastructure/supabaseRepositories.ts`; compatibilidad y validación permanecen independientes del proveedor. El lector de carpetas/autenticación/sincronización se concentra en scripts e Infrastructure.

Existe una dependencia previa de Domain hacia configurator/steps: model usa un tipo y validation usa funciones de identificación/migración. Es una dependencia de organización pendiente de revisar, sin evidencia de un bug funcional. Se documenta y no se refactoriza.

Comparación SHA-256 antes/después: solo cambiaron los tres archivos de producto descritos y `src/configurator/steps.test.ts` (expectativa obsoleta del contador). **CSS, hero, iconos, siluetas, fuentes, reglas comerciales, repositorios, contratos y migraciones no cambiaron en esta fase.** Ver artifacts/phase-21-source-diff.json.

## Deuda encontrada y pendientes

| Prioridad | Hallazgo | Decisión de esta fase |
|---|---|---|
| Alta, para producción | Falta ejecutar Auth, Edge Functions, CORS, Storage, Production con propietario y recuperación/concurrencia en un Supabase de pruebas configurado. | No afirmar validación alojada. Ejecutar en entorno de pruebas antes de publicar. |
| Alta, integración solicitada | El hero no tiene fuente Drive ni contrato de sincronización. | Documentar; no sustituir imágenes ni cambiar geometría por iniciativa propia. |
| Media | La capacidad SQL de staging admite tres adjuntos por ítem, pero el pedido confirmado/UI admite uno. Referencias reemplazadas o retiradas pueden dejar staging sin limpiar y alcanzar el límite. | Reproducción SQL guardada; revisar limpieza/lifecycle en una fase específica sin alterar silenciosamente el contrato. |
| Media | Textos válidos excepcionalmente largos, en una sola línea, pueden reducirse a tamaños inferiores a 9 px (dirección de 231 caracteres: cerca de 1 px). | El dato completo se conserva; no inventar wrap/truncado/cambio del preview aprobado. Requiere decisión UX sobre el resumen de textos extremos. |
| Media | Drive necesita credenciales permanentes y ejecución programada para sincronización continua. El catálogo actual es un snapshot y el script de sincronización está preparado. | No crear automatizaciones ni afirmar sincronización activa. S/SM queda vacía y lista para próximas cargas. |
| Baja | Domain depende del módulo de pasos; mapeos de tamaños/anchos de scripts y dominio se mantienen en dos lugares. | Reglas coinciden en pruebas. Documentar, sin refactor. |
| Baja | Textos editoriales del hero permanecen en inglés al cambiar a ES; idioma vuelve a EN al refresh. | Alcance de localización/persistencia a definir; no cambiar editorial aprobado. |
| Baja | CSS contiene correcciones acumuladas y documentos de fases anteriores describen expectativas históricas. | No limpiar por estética. Este informe describe el estado actual y las pruebas se actualizaron. |

No se corrigió silenciosamente deuda fuera del alcance. No se detectaron regresiones en los flujos vecinos cubiertos por la matriz final. La validación SQL aislada usa PostgreSQL/PGlite con stand-ins de servicios externos; no prueba disponibilidad, seguridad operativa ni concurrencia del despliegue real.

## Evidencia reproducible

- `artifacts/phase-21-unit-before.json`, `phase-21-unit-final.json`.
- `artifacts/phase-21-e2e-before.json`, `phase-21-e2e-complete.json` y `phase-21-geometry-final.json`.
- `artifacts/phase-21-added-before.json`, `phase-21-previews-before.json`, `phase-21-fixes-after.json`.
- `artifacts/phase-21-structure.json`, `phase-21-source-before.json`, `phase-21-source-diff.json`.
- `artifacts/phase-21-drive-assets.json`, `phase-21-upload-staging.json`, `phase-21-antifall-stress.json`.
- Capturas/exports: `artifacts/phase-21/`; capturas responsive adicionales: `artifacts/block-c/`, `artifacts/phase-20/`.
- Nuevas pruebas: `tests/phase-21.spec.ts`, `tests/phase-21-previews.spec.ts`; auditoría: `scripts/audit-phase-21.mjs`.

Comandos: `npm test`, `npm run test:e2e`, `npm run build`, `npm run test:sql`, `npm run test:drive`, `node scripts/test-drive-sql.mjs`, `node scripts/audit-phase-21.mjs`.
