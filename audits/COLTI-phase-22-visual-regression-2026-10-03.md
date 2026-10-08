# FASE 22 — Referencias y regresión visual

3 de octubre de 2026 · COLTI PETS

## Resultado

Se congeló el diseño actual aprobado en **120 referencias PNG**: 40 por tamaño. No se modificó el diseño ni ningún archivo del producto en src; la comparación SHA-256 de 62 archivos devuelve cero cambios.

- Desktop: 1440 × 900.
- Tablet portrait: 834 × 1194.
- Mobile: 390 × 844.
- Chrome 154.0.8037.97, Windows, capturas en píxeles CSS.

La primera ejecución crea las referencias. La segunda compara sin actualizarlas. Resultado final: **20/20 pruebas correctas**, sin actualizar las 120 referencias.

## Pantallas congeladas

Cada tamaño incluye:

| Área | Referencias |
|---|---|
| Selección de collar | Talla, fastening, tipo de tag y selección Paw con tallas. |
| Catálogo Drive real | Woven, Printed y modal de imagen; sin sustituir el catálogo por fixtures. |
| Datos | Detalles del tag y Family contact enfocado, con los últimos espacios e iconos aprobados. |
| Fonts | Selector a 35 px, modal con las 36 fuentes cargadas, selección de Font 17 y error explícito de fuente. |
| Previews | Anticaída; frente y reverso de Paw, Circle, Bone y Military. |
| Personalización | Decoration expandida, acordeones cerrados, Drawing, Photo, None, error de upload y referencia cargada. |
| Review | Vista inicial y lettering enfocado debajo del scroll. |
| Your Order | Dos collares, cerrado y expandido. |
| Confirmation | Cerrado y expandido, con fecha de prueba fija. |
| ES | Catálogo, selector de fonts, Review, Your Order y Confirmation cerrado/expandido. |

Las capturas congelan el viewport y, en las referencias enfocadas, la posición de scroll explícita. No son imágenes gigantes de las 265 tarjetas ni pretenden mostrar todo el contenido interno de una sola vez.

## Protecciones especiales

**Hero:** las referencias de desktop/tablet incluyen el hero. Se mantienen además cuatro pruebas que comprueban geometría e identidad del DOM durante Address, acordeones y error de upload a 1440 × 900, 1366 × 768, 834 × 1194 y 1194 × 834. La comprobación raster admite exclusivamente ruido de 1 nivel RGB en un máximo de 10 píxeles; no permite cambios de geometría.

**Catálogo e imágenes Drive:** tres pruebas retrasan deliberadamente las respuestas de imágenes. Comparan exactamente la caja de la tarjeta y del hero antes/después de la carga, y verifican que la imagen conserve su proporción cuadrada. Las capturas esperan la decodificación de imágenes visibles.

**Fuentes reales:** antes de capturar se verifica family colti-font y document.fonts.check en las muestras realmente visibles. Se recorren los 36 estilos del modal para cargar sus fuentes lazy. Los elementos cubiertos por un modal o recortados por un contenedor de scroll no se confunden con fallos de carga. Tres pruebas fuerzan fallo de archivos de fuentes y exigen el aviso explícito; una fuente de sistema silenciosa hace fallar las comprobaciones.

**Responsive:** todas las referencias y pruebas de carga comprueban que document.scrollWidth no exceda innerWidth. El lote vecino conserva las comprobaciones EN/ES y recuperación del pedido. No se declara cobertura de todos los dispositivos físicos ni de todos los navegadores.

**Comparación:** toHaveScreenshot con animations disabled, caret oculto, escala CSS, threshold 0.01 y maxDiffPixels 10. No hay máscaras de hero, catálogo, fuentes, previews o datos. La fecha se fija exclusivamente en el navegador de pruebas; no se modifica la aplicación. Las transiciones terminan antes de capturar.

## Archivos y ejecución

- Pruebas: `tests/phase-22.spec.ts`.
- Referencias: `tests/phase-22.spec.ts-snapshots/`.
- Manifiesto SHA-256 y versión de navegador: `artifacts/phase-22-baseline-manifest.json`.
- Antes de producto: `artifacts/phase-22-product-before.json`.
- Reportes: `artifacts/phase-22-baseline.json`, `phase-22-verification.json`, `phase-22-unit.json`.
- Vista de conjunto: `artifacts/phase-22/contact-sheet.jpg`.

Ejecutar la regresión habitual con `npm run test:visual`. Este comando compara las referencias y también ejecuta la protección del hero. No actualiza snapshots.

Si falla una comparación, revisar expected / actual / diff en test-results, reproducir y determinar la causa. **No actualizar referencias para ocultar un fallo.** La regeneración con `--update-snapshots` se reserva para un cambio de diseño explícitamente aprobado. Debe revisar las imágenes y actualizar el manifiesto de hashes junto con las referencias.

Estas referencias dependen del sistema y versión de Chrome registrados. Una actualización de navegador/SO exige comparar las diferencias antes de aceptar una nueva baseline. No se configuró una plataforma CI nueva ni un pipeline externo durante esta fase; el comando está listo para integrarlo.

## Validaciones y límites

- Creación inicial: 12 pruebas correctas y 120 referencias.
- Verificación independiente: **20/20 correctas** (12 de FASE 22, cuatro de estabilidad del hero y cuatro de flujos vecinos), en 1,3 minutos.
- Unitarias: 118 correctas.
- Typecheck y build: correctos.
- Archivos de producto modificados: **0**.

Se añadió un comando de pruebas a package.json. Una aserción histórica de Family contact se alineó con la reducción de espacio que el usuario aprobó después de FASE 21 (antes exigía 20 px y ahora el espacio es aproximadamente 17,33 px). No se cambió el espaciado del producto en esta fase.

Los fallos durante la preparación fueron ajustes del harness: etiquetas de traducción, esperas de lazy loading y manejo de rutas retrasadas. Se corrigieron en las pruebas, no en React, CSS, reglas, previews ni integraciones.

Permanecen las limitaciones documentadas en FASE 21: Supabase alojado sin verificar, hero local sin integración Drive, limpieza de adjuntos temporales y legibilidad de cadenas extremas. No se corrigieron silenciosamente ni se tomaron capturas locales como certificación de producción.


## Cambio aprobado posterior

Después de esta fase, el usuario solicitó la opción 28 a 45 px. Al iniciar FASE 23 se actualizaron únicamente 11 referencias afectadas (selector EN/ES, estado de error y fondo visible detrás del modal desktop). El manifiesto registra sus hashes anteriores/nuevos. La limpieza CSS se compara contra esa base aprobada; no autoriza actualizar otras referencias.
