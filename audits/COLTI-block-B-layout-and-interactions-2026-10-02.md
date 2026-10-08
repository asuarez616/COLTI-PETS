# COLTI — Bloque B: fases 4 y 5

## Alcance

Esta entrega corresponde a las nuevas fases **Layout Stability / Zero Visual Jumps** y **Dynamic UI / Smooth Interactions** solicitadas. No implementa el motor de pasos que figuraba con el número 4 en el plan anterior.

Se mantuvieron imágenes, tipografías, colores, opciones y reglas de selección. No se modificaron Supabase, payloads, esquema SQL ni los modelos de dominio de las fases 1–3. Los cambios de altura del shell y scroll local son la corrección expresamente solicitada.

## Referencia inicial

Antes de modificar: typecheck, 34 unitarias y build aprobados. Se conservaron seis capturas de inicio y personalización cerrada en `artifacts/stabilization/block-b-before/`, para desktop, tablet y móvil. Las referencias posteriores están en `artifacts/stabilization/block-b-after/`.

Las dos capturas móviles son idénticas antes/después. Desktop/tablet cambian por la altura independiente del shell, la reserva estable del scrollbar y el aislamiento de pintura; no se cambió el diseño de sus controles. Se inspeccionó visualmente la referencia tablet posterior.

## Fase 4 — geometría independiente

### Cambios

- `ConfiguratorLayout` separa `EditorialHero` del panel dinámico.
- El hero está memoizado; sus props son idioma e índice editorial. Un campo o accordion del formulario no modifica esas props ni remonta sus imágenes.
- En desktop/tablet, el shell ocupa la altura disponible del viewport. Header y footer conservan su espacio; el main puede reducirse sin adoptar la altura del formulario.
- El hero llena exclusivamente esa región. Su altura y crop no dependen del contenido derecho.
- El panel derecho tiene scroll propio, gutter estable, contención del overscroll y anchoring desactivado. Añadir contenido no aumenta la altura de la página ni cambia el ancho al aparecer el scrollbar.
- Se aisló la pintura de la región editorial.
- En móvil se conserva el scroll normal de página y el hero continúa oculto.
- Se conserva el cambio editorial intencional al avanzar de step; las interacciones dentro de un step no lo activan.

### Archivos

Nuevo `src/ConfiguratorLayout.tsx`; cambios en `src/main.tsx` y `src/editorial.css`; nuevo `tests/layout-stability.spec.ts`.

La geometría deja de depender del estiramiento del main según el formulario. No se agregaron reglas específicas para modelos de iPad ni cambios manuales de object-position.

### Acceptance test

Probado a 1440×900, 1366×768, 834×1194 y 1194×834:

1. Abrir/cerrar Address.
2. Abrir/cerrar Decoration, Drawing y Photo.
3. Provocar un error de upload.
4. Comparar el hero antes/después de cada acción.
5. Muestrear durante las transiciones su rectángulo, object-fit, object-position, opacidad, imagen activa, scroll de página e identidad/conexión de los nodos de imágenes.

Las capturas se comparan sin tolerancia de diferencia. La prueba usa rasterización determinista de Chrome para evitar pequeñas variaciones de dithering del GPU: durante el diagnóstico se observaron diferencias de 1 nivel RGB en pocos píxeles con geometría, imagen y nodos idénticos. No se relajó la comparación para ocultar movimientos.

Al cerrar la primera parte: typecheck, 34 unitarias, build y cuatro acceptance tests aprobados. Después de añadir las transiciones, los cuatro acceptance tests volvieron a pasar, incluida una ejecución repetida de ocho casos.

## Fase 5 — expansiones y cierres reales

### Cambios

- Nueva primitive `Reveal`, usada en Decoration/Drawing/Photo, campos de Extra details, feedback/lista de archivos y mensajes de error/aviso.
- Se mide la altura intrínseca con ResizeObserver. Las transiciones CSS animan apertura, cierre y variaciones de contenido de un panel abierto.
- Duración/easing centralizados: 180 ms. No hay setTimeout ni duración JavaScript utilizada para desmontar contenido o actualizar reglas de negocio.
- Los hijos se crean al visitar la sección y se mantienen al cerrar para que el colapso tenga contenido real y conserve sus nodos.
- Las regiones cerradas quedan `inert` y `aria-hidden` inmediatamente, aunque terminen de animarse visualmente.
- El encabezado conserva su botón nativo y chevron; se añadieron IDs y relaciones completas entre header y región.
- Las opciones internas no cierran el accordion. La selección sigue siendo independiente de la apertura.
- `prefers-reduced-motion` elimina las transiciones.
- Las antiguas animaciones de entrada de los campos/paneles se desactivan únicamente dentro de Reveal, evitando dos animaciones superpuestas.
- No se añadió scrollIntoView ni movimientos de scroll al expandir/cerrar.

### Archivos

Nuevos `src/Reveal.tsx`, `src/interactions.css` y `tests/dynamic-interactions.spec.ts`.

Modificados `src/PersonalityOptions.tsx`, `src/TagExtraDetails.tsx`, `src/configurator/Configurator.tsx`, `src/main.tsx` y `tests/configurator.spec.ts`.

Duplicación eliminada: las distintas secciones ya no tienen cada una su mecanismo de aparición/desaparición. Una primitive controla exclusivamente presentación y accesibilidad; no selecciona modalidades ni altera payloads.

El E2E existente de upload ahora identifica el textarea visible, porque los hijos cerrados permanecen en DOM para poder animarse. No se cambió el producto para satisfacer selectores antiguos.

### Pruebas añadidas

- Alturas intermedias en apertura y cierre, a 1440, 834 y 390 px.
- Foco conservado al utilizar Enter en el encabezado.
- DOM retenido e inert al cerrar.
- Ninguna modalidad seleccionada por la animación.
- Heart mantiene Decoration abierto.
- Address conserva su valor y foco al escribir; cierre suave.
- Reduced motion sin alterar selección.
- Resize suave de un panel abierto durante upload/feedback.
- Apertura y cierre del mensaje de error, con scroll general en cero.

## Resultado final

| Comprobación | Resultado |
|---|---|
| Typecheck | Aprobado |
| Unitarias de dominio/validación | 34/34 aprobadas |
| E2E completos | 18/18 aprobados |
| Build | Aprobado |
| Hero durante las interacciones | Geometría/nodos estables y capturas exactas en los cuatro viewports probados |
| Móvil, inicio y personalización cerrada | Capturas anteriores/posteriores idénticas |

## Límites y pendientes

La verificación utiliza Chrome automatizado con viewports tablet; no constituye una prueba en hardware iPad/Safari. La matriz visual completa de todos los steps y navegadores sigue pendiente.

El motor de pasos/contador heredado, overflow de textos dentro de TagFaces, seguridad SQL y las otras fases de la auditoría permanecen fuera de esta entrega. No se declara preparación total para producción ni conformidad WCAG.

No se continuó a otra fase después de completar este Bloque B.
