# COLTI — estabilización, fases 1–3

## Alcance

Se implementaron exclusivamente las fases 1, 2 y 3 solicitadas. No se cambió React/Vite/TypeScript ni Supabase. No se agregaron dependencias. No se modificaron CSS, imágenes, tipografías, layout ni archivos sincronizados de `sources/`. No se continuó con el motor de pasos o las fases 4–20.

El proyecto no tiene repositorio Git en este directorio; este registro y las referencias visuales documentan la entrega. Los adaptadores mantienen el formato existente de SQL y snapshots para evitar una migración destructiva de datos.

## Estado inicial y referencias

Antes de editar: typecheck aprobado; 6 unitarias aprobadas; build aprobado; E2E 4 aprobadas y 2 fallidas por expectativas antiguas. Se conservaron seis capturas en `artifacts/stabilization/before/`: inicio y personalización cerrada en desktop 1440×1000, tablet 834×1194 y móvil 390×844.

Las mismas seis capturas posteriores están en `artifacts/stabilization/after/`. Su comparación SHA-256 produjo imágenes idénticas en los seis casos. El resultado está en `artifacts/stabilization/comparison.json`. Esto prueba equivalencia de esas pantallas/estados, no sustituye una cobertura visual de todos los steps y estados abiertos, prevista en fase 18.

## Fase 1 — integridad de personalización

- Abrir/cerrar Decoration, Drawing o Photo cambia únicamente estado local de apertura.
- Cerrar mantiene la selección. Los tres accordions pueden estar abiertos independientemente.
- Elegir una decoración selecciona explícitamente `decoration`, asigna `nameDecoration` en dominio y `decorationIcon` en el contrato existente.
- La transición de modalidad excluye adjuntos de otro propósito e instrucciones de otra modalidad del collar final.
- Cada upload recibe explícitamente el propósito de su sección; no toma accidentalmente la modalidad anterior.
- Los inputs de archivo del accordion dejaron de compartir el ref usado por la pantalla heredada. El reintento conserva su propósito y las listas de archivos se filtran por modalidad.
- Las instrucciones de Photo no se muestran como instrucciones de Drawing cuando ambos están abiertos.

Archivos: `src/PersonalityOptions.tsx`, `src/DecorationOptions.tsx`, `src/configurator/Configurator.tsx`, nuevo `src/domain/personalization.ts` y `src/domain/personalization.test.ts`.

Duplicación eliminada: la validez de personalización dejó de vivir dentro de un componente React; las transiciones y los iconos aplicables son funciones de dominio. Decoration ya no sincroniza datos persistentes mediante un efecto al abrirse.

Pruebas: payload serializado después de Photo → Heart, exclusión de archivo de otro propósito y separación de instrucciones. Al cerrar esta fase: typecheck, 9 unitarias y build aprobados. La prueba de navegador final también abre los tres accordions, comprueba que no seleccionan una modalidad, elige Heart, cierra/reabre y confirma; inspecciona el snapshot guardado, no solo el color del botón.

## Fase 2 — modelo de dominio

Se incorporaron `TagConfiguration`, `CollarConfiguration`, `PersonalizationConfiguration` y `OrderConfiguration`, reutilizando Customer, Attachment, Design, Font y Size existentes. `OrderConfiguration.collars[]` representa múltiples entidades independientes.

PersonalizationConfiguration es una unión discriminada: none, decoration con una decoración e iconos, o drawing/dog_photo con instrucciones y adjuntos. Los valores de decoración e información tienen tipos cerrados. El dominio no depende de React ni Supabase.

`getCollarConfiguration`, `toItem`, `getOrderConfiguration`, `orderItems` y `confirmationPayload` forman una frontera explícita entre dominio y DTO existente. Confirmación demo y Supabase usan la misma normalización de collares. El payload no contiene paso, modal o accordion. Los iconos automáticos se derivan de datos reales al serializar, sin depender de que se haya abierto Decoration.

El formulario conserva Item como contrato de edición compatible durante esta entrega. No se reescribieron todas las pantallas para adoptar el modelo anidado: hacerlo ahora mezclaría estas fases con las proyecciones y el motor de pasos posteriores. El nuevo modelo participa realmente en la confirmación; no es una interfaz sin uso.

Archivos: nuevo `src/domain/configuration.ts`, `src/domain/configuration.test.ts`; cambios en `src/domain/model.ts`, `src/domain/extras.ts`, `src/data/backend.ts`.

Duplicación eliminada: serialización de confirmación central, reglas compartidas de personalización y cast de un objeto incompleto a Item para convertir extras a texto. Las pruebas verifican ida/vuelta, payload sin UI state y múltiples collares. Al cerrar esta fase: typecheck, 11 unitarias y build aprobados.

## Fase 3 — validación runtime y drafts

Nueva frontera de validación explícita para Customer, Item, Attachment, ticket de upload, Design, Font, Order, lista de pedidos y Draft. Comprueba objetos/arrays, campos obligatorios, enums, longitudes, números finitos, cantidades, categorías, email y metadata de archivo.

- El draft vigente pasa a versión 2.
- La clave `colti-draft-v1` se conserva para encontrar y migrar sesiones existentes. La versión del contenido determina el formato.
- Un v1 estructuralmente válido se migra a v2 conservando cliente, collares, edición y posición.
- Un JSON corrupto, estructura inválida o versión desconocida se elimina y se inicia un borrador válido.
- El acceso denegado al almacenamiento también permite iniciar en memoria.
- Solo se reconstruyen campos conocidos de Draft/Item; propiedades temporales añadidas a objetos no se restauran.
- Los campos opcionales null emitidos por PostgreSQL se normalizan a ausentes. Hay una prueba específica del contrato SQL.
- Confirmación valida su entrada antes de serializar; catálogo y respuestas relevantes de pedidos se validan al entrar; upload valida ticket y resultado final. Los pedidos demo leídos también se validan.

Archivos: nuevo `src/domain/validation.ts`, `src/domain/validation.test.ts`; cambios en `src/configurator/state.ts`, `src/domain/model.ts`, `src/data/backend.ts`.

Duplicación eliminada: comprobaciones superficiales independientes de datos restaurados y retornos externos tratados directamente como tipos fiables. TypeScript strict se mantuvo; no se añadieron `any`. Los parseadores permiten estados incompletos legítimos de un formulario; las reglas de finalización siguen separadas de la validez estructural.

Los índices numéricos antiguos se conservan hasta fase 4. La migración de estructura no altera por su cuenta la navegación aprobada.

## Verificación final

| Verificación | Resultado |
|---|---|
| Typecheck | Aprobado |
| Unitarias | 34/34 aprobadas |
| E2E | 8/8 aprobados |
| Build | Aprobado |
| Referencias visuales iniciales/posteriores | Seis imágenes idénticas |

Se actualizaron `tests/configurator.spec.ts` y `tests/fonts.spec.ts` para el flujo vigente: selección de lettering en modal, upload dentro de Photo, nombres accesibles de edición y resumen compacto. Se agregó `tests/stabilization.spec.ts` para independencia de accordions, resultado de confirmación y recuperación de draft corrupto. No se cambió la UI para satisfacer selectores antiguos.

Herramientas reproducibles: `scripts/stabilization-visual.mjs before|after` y `scripts/stabilization-compare.mjs`. Los scripts temporales usados para aplicar cambios se eliminaron.

## Deuda y límites que permanecen

1. **Fase 4:** motor de pasos, contador/barra, índices heredados y posición del subflujo Hanging.
2. **Fases 5–6:** primitives reutilizables y animación de cierre del accordion. Esta entrega corrige integridad, no su presentación.
3. **Fases 7–9:** completar reglas y proyecciones para todos los contextos; overflow de TagFaces sigue pendiente.
4. **Fases 10–12:** desacoplar infraestructura y validar también en PostgreSQL los nuevos campos/purpose. Las validaciones frontend de esta entrega no sustituyen las del servidor. No se modificaron migraciones ni se verificó un Supabase remoto.
5. Los archivos excluidos al cambiar modalidad dejan de formar parte del payload; su eliminación física inmediata debe coordinarse con AttachmentRepository y las reglas de descarte. No se afirma que esta entrega elimine todos los huérfanos de Storage.
6. La confirmación demo se probó en navegador. Idempotencia con respuesta perdida en Supabase remoto sigue en fase 14.
7. La suite visual completa, rendimiento y accesibilidad quedan en sus fases correspondientes. No se declara conformidad WCAG ni preparación total para producción.

Se detiene la implementación aquí para revisar estas tres fases antes de continuar.
