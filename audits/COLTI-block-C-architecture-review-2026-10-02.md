# COLTI — Bloque C: segunda revisión técnica

Fecha: 2026-10-02. Alcance: fases 6–11. Se conserva el diseño aprobado del configurador.

## Resultado por fase

| Fase | Resultado | Fuente principal |
|---|---|---|
| 6 — Motor | IDs semánticos; visibilidad, validación, Next, Back y progreso compartidos; edición y guardado usan destinos del motor | `src/configurator/steps.ts`, `state.ts` |
| 7 — Componentes | StepHeader, ProgressBar, OptionCard, OptionGrid, IconOption y NavigationActions extraídos; se conservan ConfiguratorLayout, Modal, DesignImage y FontSample existentes | `src/ui/ConfiguratorParts.tsx` |
| 8 — Accordion | Decoration, Drawing y Photo usan AccordionItem; apertura independiente de la selección; header completo, teclado, ARIA, chevron y Reveal con cierre animado | `src/ui/Accordion.tsx` |
| 9 — Dominio | Fachada pura para anchos, diseños, tamaños de placa, selección de forma y validación; se reutilizan validadores existentes, sin duplicarlos | `src/domain/rules.ts` |
| 10 — Proyecciones | Review, Order Summary, producción y PDF/JPG consumen resúmenes comunes; se preservan datos extra e instrucciones históricas | `src/domain/presentation.ts` |
| 11 — Preview | TagFaces queda como adaptador; TagPreview recibe datos, conserva siluetas originales y ajusta texto por medidas renderizadas; nombre usa FittedLettering y la fuente seleccionada | `src/ui/TagPreview.tsx` |

## Flujo y drafts

- Nuevos drafts: versión 3 y `step` semántico. Se conserva la clave de almacenamiento existente para recuperar sesiones.
- Versiones 1 y 2: migración de todos los índices 0–16. Notas y upload antiguos (12/13) se recuperan en Personalization. Ya no existen pantallas numéricas de ejecución para ellos.
- Forma y tamaño de Hanging permanecen juntos. Circle asigna automáticamente su tamaño; cambiar de modelo limpia el tamaño anterior. Back y recarga conservan el subflujo. Anti-fall omite la forma.
- El contador del collar muestra **11 decisiones efectivas**; cliente mantiene sus 2 pantallas iniciales. Tipo/forma/tamaño de placa comparten una posición. Barra y contador se calculan del mismo conjunto visible: Personalization es 10/11 y Review 11/11.
- Las reglas de confirmación y guardado consultan la validación central. Se conserva la posibilidad de enviar un campo vacío para recibir su error inline en las pantallas que ya funcionaban así.

## Preview: ajuste y límites comprobados

Se probaron Paw, Circle, Bone, Military y Anti-fall a 390, 834 y 1440 px con Maximiliano Rodriguez, dirección larga, varios teléfonos, email, información médica, contacto familiar y Spayed.

Los SVG originales contienen dimensiones físicas de papel distintas de su viewBox recortado. El cargador normaliza únicamente las dimensiones de presentación en memoria: no modifica archivos ni trazos. Esto evita espacios de lienzo que antes invalidaban la posición del grabado.

El ajuste de datos mide ancho **y altura reales**. El preview usa un mínimo de 6 px para su miniatura. Si el contenido no cabe a ese mínimo, permanece dentro del área útil mediante scroll interno accesible con teclado y una indicación visible. No se elimina contenido, no se usa ellipsis y no se permite desbordamiento exterior. Este fallback aparece en algunas geometrías del caso deliberadamente denso: no implica que todos los datos sean visibles simultáneamente.

En contenedores estrechos con muchos datos, ambas caras se apilan para conservar ancho útil. La fuente del nombre mantiene el ajuste por medida renderizada de FittedLettering; no se reemplaza por conteo de caracteres.

## Verificación

- TypeScript: correcto.
- Build de producción: correcto; actualizado para la vista local de 4173.
- **45 pruebas unitarias**: validación, inventario, migraciones, independencia de collares, flujo condicional y proyecciones, incluidas notas históricas.
- **35 casos de navegador distintos comprobados**: 18 regresiones existentes + 17 casos nuevos. La suite de 34 pasó completa antes de incorporar el último caso Hanging; luego se verificaron los 17 casos de arquitectura y las 5 regresiones de configurador/exportación.
- Hero: comparación exacta de píxeles y geometría durante Address, Decoration, Drawing, Photo y error de upload a 1440×900, 1366×768, 834×1194 y 1194×834.
- Accordions: apertura/cierre, conservación de foco y DOM, contenido inerte cerrado y reduced motion comprobados.
- Dos collares, edición, upload, confirmación única, recuperación de draft y PDF/JPG multipágina: correctos.
- Comparación visual de personalización cerrada en tablet: misma composición; cambio intencional limitado a contador/barra. Capturas de inicio y personalización cerrada: `artifacts/stabilization/block-c-after/`.
- Capturas de las cinco geometrías en tres anchos: `artifacts/block-c/`.

## Punto de revisión

Bloque C completado. No se modifican imágenes de producto, selección de catálogo, siluetas originales, hero, header ni estilos de marca. Los adaptadores conservan el contrato de snapshots/SQL; esta revisión valida el cliente y los flujos demo, sin desplegar cambios de backend. El fallback de datos extensos del preview queda documentado para revisión visual antes de continuar con otra fase.
