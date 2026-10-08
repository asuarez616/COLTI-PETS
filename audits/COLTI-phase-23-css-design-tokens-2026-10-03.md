# FASE 23 — CSS y design tokens: limpieza controlada

3 de octubre de 2026 · COLTI PETS

## Resultado

Se realizó una consolidación acotada, con valores exactos y sin reescribir el CSS. **47 tokens compartidos**, **2.215 declaraciones efectivas equivalentes** y **62 media queries conservadas con sus condiciones y orden originales**.

Resultado final: **132/132 E2E correctas**, incluidas las comparaciones de **120 referencias visuales**, sin actualizar ninguna durante la limpieza.

## Base aprobada antes de limpiar

FASE 22 congeló el selector antes del cambio que el usuario pidió después: opción 28 a 45 px. La comparación inicial reprodujo esa diferencia. Se actualizaron únicamente 11 referencias afectadas: selector EN/ES y error en tres tamaños, más los dos modales desktop cuyo fondo deja ver el selector. Los PNG anteriores y hashes se conservaron en artifacts. Esta actualización se hizo **antes de modificar CSS**, por el cambio explícitamente aprobado, no para aceptar la limpieza.

Las 120 referencias de la base actual pasaron antes de aplicar tokens (12/12 pruebas de FASE 22). Las cuatro pruebas del hero también habían pasado en el diagnóstico previo.

Se reprodujo además un desfase de captura mobile de 7 px tras cerrar un acordeón: la captura se tomaba después de un scroll automático durante la transición. La prueba ahora fija el scroll superior al capturar ese estado. No se modificó el comportamiento del acordeón ni se cambió su referencia visual. Las comparaciones usan aserciones soft para informar todas las diferencias de una matriz; cualquier diferencia sigue haciendo fallar la prueba.

## Cambios realizados

| Área | Cambio mínimo | Conservado |
|---|---|---|
| Colores | Definiciones existentes de root centralizadas; aliases de la misma tonalidad. | Valores hex, diferencias entre tonos y todos los estados. |
| Tipografías | Tokens para Montserrat/Playfair y tamaños repetidos de UI. | Archivos de fuentes, fallbacks, fuentes del nombre, clamps y ajustes por modelo. |
| Spacing | Tokens para valores repetidos 4/6/8/10/12/14/16/18/20/24/28/32 px. | Unidades originales, medidas pt y calc aprobados; no se creó una escala nueva. |
| Tamaños | Alturas comunes de controles y valores unitless del selector rápido 35/45. | Dimensiones de tarjetas, hero, placa y layout responsive. |
| Borders / radios | border-subtle y radios 6/8/10/12 con los valores existentes. | Grosor, estilo, color y radios diferentes. |
| Transitions | Duración .2s y parámetros del disclosure centralizados. | Duraciones, easing, reduced motion y animaciones del hero. |
| Componentes repetidos | Valores compartidos de controles/tarjetas; bloque de información del preview consolidado. | DOM, JSX, clases, navegación y composición visible. |
| Overrides | Se eliminaron declaraciones anteriores ya sustituidas del bloque de filas del preview y raíces duplicadas. | Especificidad, media queries y overrides de geometría/viewport. |
| Breakpoints | Registro compartido en la documentación. | Los límites se mantienen literales; no se movieron ni fusionaron bloques responsive. |

No se introdujeron cascade layers, preprocesadores, dependencias ni componentes React nuevos. CSS custom properties no sirven para los límites de @media; usarlas allí rompería el responsive. Por eso el registro está consolidado documentalmente y las queries verificadas permanecen intactas.

Archivos de producto modificados:

- `src/design-tokens.css`: nuevo punto central de valores.
- `src/main.tsx`: una importación CSS antes de los estilos actuales.
- `src/styles.css`: sustituciones de valores y raíces centralizadas.
- `src/interactions.css`: parámetros compartidos, sin modificar el disclosure.
- `src/ui-corrections.css`: tokens y consolidación localizada de filas.

**No cambiaron** editorial.css, accessibility.css, componentes de navegación, tagPreviewConfig, siluetas, assets, fuentes, Domain/Application/Repositories/Infrastructure, Drive, Supabase, contratos ni business rules.

## Antes / después

| Comprobación | Antes | Después |
|---|---:|---:|
| Tokens root centralizados | Definiciones distribuidas | 47 en un archivo |
| Bloques en los tres CSS intervenidos | 824 | 815; 816 incluyendo la nueva raíz de tokens |
| Referencias var en esos tres archivos | 129 | 329 |
| Declaraciones finales comparadas | 2.215 | 2.215 equivalentes, 0 diferencias |
| Media queries | 62 | Mismas 62 y mismo orden |
| Referencias visuales | 120 de la base aprobada a 45 px | 120 correctas; 0 PNG actualizados por la limpieza |
| Typecheck | Base funcionando | Correcto |
| Unitarias | 118 en fase anterior | 118 correctas |
| Build | Correcto | Correcto |
| E2E integral | Cobertura existente | 132/132 correctas |

El CSS compilado aumenta aproximadamente de 64,89 a 67,34 kB (gzip de 11,92 a 12,32 kB). Esta fase mejora el mantenimiento y la coherencia de valores, no intenta reducir el bundle. No se compensó ese pequeño aumento eliminando estilos sin evidencia de que fueran innecesarios.

## Cómo se verificó

1. Comparación inicial con FASE 22 y reproducción de diferencias autorizadas/preexistentes.
2. Archivo anterior guardado y registro SHA-256 de src.
3. Auditoría de la propuesta con PostCSS existente en Vite: expansión de tokens y comparación de valores finales por selector, propiedad y contexto. También compara condiciones y orden de todas las media queries.
4. Misma auditoría aplicada al CSS final: 0 diferencias en 2.215 declaraciones.
5. Typecheck, 118 unitarias y build.
6. E2E completo, incluyendo FASE 22, sin actualizar snapshots durante la limpieza: **132/132 correctas, 0 fallos y 0 flaky**, en 4,7 minutos.

La auditoría de declaraciones no demuestra por sí sola que no haya efectos de cascada entre selectores distintos. Se combina con las referencias y con pruebas de hero, fuentes reales, carga Drive, responsive, reduced motion, uploads, Review, Your Order, Confirmation, exports y flujos EN/ES.

## Deuda conservada conscientemente

- Siguen existiendo overrides históricos y reglas responsive cuya fusión podría alterar la cascada. No se eliminaron por parecer redundantes.
- Los valores específicos de previews, geometría y clamps no se trasladaron a tokens genéricos. tagPreviewConfig continúa siendo la autoridad por modelo.
- No se implementó un preprocesador para breakpoints ni una nueva estructura de CSS. Eso exigiría otra decisión de arquitectura y cobertura.
- Las referencias son Windows/Chrome y sus tamaños registrados; no sustituyen pruebas en dispositivos físicos o otros motores.
- Continúan los pendientes de FASE 21 sobre Supabase alojado, Drive del hero, adjuntos temporales y textos extremos. No pertenecen a esta limpieza y no se corrigieron silenciosamente.

## Archivos de consulta y evidencia

- Guía: `docs/design-tokens.md`.
- Auditoría CSS histórica: `scripts/audit-css-phase23.mjs`.
- Inventario: `artifacts/phase-23-css-inventory.json`.
- Equivalencia: `artifacts/phase-23-css-equivalence-proposal.json` y `phase-23-css-equivalence.json`.
- CSS anterior: `artifacts/phase-23-css-before/`.
- Referencias previas de opción 28: `artifacts/phase-23-approved-28-before/`.
- Cambios aprobados de referencia: `artifacts/phase-23-approved-28-reference-update.json`.
- Verificación previa: `artifacts/phase-23-approved-baseline.json`.
- Resultados finales: `artifacts/phase-23-unit-after.json`, `phase-23-e2e-after.json`, `phase-23-final-summary.json`.
- Referencias de comparación: `tests/phase-22.spec.ts-snapshots/` y su manifiesto con la enmienda aprobada.

Comandos habituales: `npm run test:visual`, `npm test`, `npm run test:e2e`, `npm run build`. La auditoría CSS contra el archivo histórico se reproduce con `node scripts/audit-css-phase23.mjs`.
