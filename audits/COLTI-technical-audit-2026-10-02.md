# Auditoría técnica COLTI — 2 de octubre de 2026

## Alcance y conclusión

Revisión del código local, navegación, datos, componentes, estilos, Supabase, migraciones, exportación y pruebas. No se modificó el configurador ni se refactorizó la interfaz. Los archivos de `sources/` se trataron como referencias de solo lectura.

La base es aprovechable: React y TypeScript, reglas de compatibilidad explícitas, separación inicial del dominio y servicios, confirmación transaccional e idempotente en SQL y almacenamiento privado de archivos. Sin embargo, no recomiendo considerar el proyecto listo para producción todavía. Hay discrepancias entre lo que se muestra y lo que se guarda en personalización, navegación heredada, validación incompleta de campos nuevos y pruebas que ya no representan el flujo actual.

Este informe distingue problemas reproducidos, riesgos observados en código y aspectos pendientes de verificar en un entorno real. Que existan las migraciones y funciones no demuestra que estén desplegadas correctamente.

## A. Arquitectura y tecnologías

| Área | Implementación actual |
|---|---|
| Interfaz | React 19.1.1 y React DOM 19.1.1 |
| Lenguaje | TypeScript 5.9.2, modo estricto |
| Construcción | Vite 7.1.7 |
| Backend | Supabase JS 2.57.4; PostgreSQL, Auth, Storage y Edge Function |
| Exportación | pdf-lib 1.17.1 y canvas |
| Pruebas | Vitest 3.2.4, Playwright 1.55.1, PGlite 0.3.10 |
| Entorno | Node >=22.12; pnpm 11.19.0 |
| Estilos | CSS propio; sin framework de componentes |
| Estado y formularios | React local; sin biblioteca de formularios o estado global |
| Rutas | Navegación hash gestionada manualmente |

`src/main.tsx` organiza la aplicación, idioma y rutas. `src/configurator/Configurator.tsx` concentra navegación, formularios, catálogo, modales, archivos, confirmación y resumen. Existen separaciones útiles en `src/domain/`, `src/data/`, `src/catalog/` y `src/exports/`, pero el controlador todavía tiene demasiadas responsabilidades.

No hace falta reemplazar el stack ni introducir una biblioteca grande para corregirlo. La prioridad es separar responsabilidades y hacer explícito el flujo conservando el DOM y CSS aprobados.

## B. Organización y componentes

### Mapa del código

| Archivo / área | Responsabilidad |
|---|---|
| `src/main.tsx` | App, layout, idioma, rutas y Boundary |
| `src/configurator/Configurator.tsx` | Controlador del configurador |
| `src/configurator/state.ts` | Crear, guardar, editar y quitar collares |
| `src/domain/model.ts` | Tipos, compatibilidad y validación |
| `src/domain/tags.ts` | Formas y tamaños de placas |
| `src/domain/extras.ts` | Datos adicionales estructurados y texto derivado |
| `src/components.tsx` | Componentes generales, detalle y exportaciones |
| `src/data/backend.ts` | Adaptador demo/Supabase |
| `src/catalog/` | Manifiesto y carga de tipografías |
| `src/production/Production.tsx` | Acceso y gestión de producción |
| `src/exports/` | Documentos PDF/JPG |
| `supabase/` | Esquema, permisos, RPC, Storage y verificación de archivos |
| `scripts/` | Assets, pruebas, limpieza y operaciones administrativas |

### Inventario de componentes

Se identificaron App, Boundary, Configurator, Production, EditorialCarousel, ClosureIcon, DesignImage, Modal, FontSample, AttachmentLink, ItemCard, Downloads, OrderDetail, FittedLettering, LetteringSelector, DesignPreview, TagExtraDetails, PersonalityOptions, DecorationOptions, TagFaces, CollarReview y OrderCollarSummary. También hay pequeños helpers de campos, opciones e iconos internos.

Equivalencias con una arquitectura reutilizable:

| Concepto | Estado actual |
|---|---|
| ConfiguratorLayout | Está en App; no es una pieza independiente |
| StepHeader / ProgressBar | JSX dentro del controlador |
| OptionCard / OptionGrid | Helpers y reglas CSS con variantes repetidas |
| IconOption | Composición de botón e ilustración |
| Accordion / AccordionItem | Implementación dentro de PersonalityOptions |
| Back / Continue / Skip | Acciones renderizadas por el controlador |
| TagPreview | TagFaces |
| ImageUpload | JSX del controlador y funciones del backend |
| DesignCard | JSX y DesignImage |
| FontCard | FontSample y selección de lettering |

DesignImage, FontSample y FittedLettering son buenas bases de reutilización. La futura extracción debe preservar tamaños, posiciones y estilos; no es una invitación a rediseñar.

## C. Duplicación y deuda técnica

1. El flujo está distribuido entre índices numéricos, condiciones JSX, validaciones y funciones next/back. No existe una única definición de pasos.
2. La representación de datos del collar aparece en review, resumen, producción y documentos. Es fácil que un nuevo campo se omita en una de ellas.
3. Los modales repiten gestión de Escape, foco y cierre. Conviene consolidar comportamiento manteniendo cada presentación.
4. Las reglas de talla/ancho y placas existen en frontend y SQL. La duplicación entre capas es necesaria para seguridad, pero falta una verificación automática de paridad.
5. Las migraciones recientes vuelven a definir la función completa de confirmación. Cada copia aumenta el riesgo de perder validaciones al añadir campos.
6. El CSS contiene reglas iniciales y ajustes posteriores que se superponen. Hay deuda de cascada; una limpieza debe comenzar por pruebas visuales, no por borrar reglas indiscriminadamente.
7. `extra_text` y los nuevos datos estructurados representan parcialmente la misma información. Debe definirse qué dato es canónico y cuándo se deriva el texto.

## D. Motor del configurador y progreso

La navegación utiliza `draft.step` numérico. El flujo normal del collar recorre índices 2–11 y 14. Los índices 12 y 13 mantienen pantallas antiguas de notas/upload que ya no son parte del recorrido normal, pero siguen siendo renderizables desde un borrador antiguo. Hay referencias de edición heredadas a esos destinos.

El contador muestra `(step - 1) / 13`, mientras la barra usa `(step + 1) / 15`. Esto permite saltar de 10/13 a 13/13 sin que el contador describa las decisiones reales. El subestado type/shape de Hanging es local y se pierde al recargar.

Recomendación: definir pasos con identificadores estables y propiedades de visibilidad, validación y navegación. Calcular contador, barra, next y back desde la misma lista. Migrar borradores antiguos explícitamente. No cambiar por separado el número visible: primero acordar si cuenta pantallas principales o decisiones condicionales.

Hanging combina forma y tamaño dentro del mismo paso; las formas de tamaño único se asignan automáticamente. Anti-fall conserva su ruta. Esta lógica es válida y debe conservarse.

## E. Estado, persistencia e integridad

El borrador contiene cliente, lista de collares, collar actual, paso, identificadores de borrador/idempotencia y estado de edición. Los helpers de estado reemplazan un collar por ID y conservan sus hermanos; es una base correcta para pedidos múltiples.

La persistencia del borrador es `sessionStorage` (`colti-draft-v1`), no una cuenta de cliente ni un borrador remoto. Los pedidos demo también usan sessionStorage; los binarios demo usan IndexedDB. No debe presentarse como recuperación garantizada entre dispositivos o sesiones.

La restauración solo comprueba superficialmente versión, arrays, objetos y rango de paso. Un JSON con estructura incorrecta puede pasar estas comprobaciones y provocar errores posteriores. Boundary ofrece recarga, pero recargar no elimina un borrador corrupto y puede repetir el fallo.

Hay un único `personalization_type`, pero varios accordions pueden estar abiertos simultáneamente. Reproducción: abrir Decoration, Drawing y Photo, y luego elegir Heart en Decoration deja `personalization_type: dog_photo`. Lo visible y lo guardado pueden no coincidir. Además, Drawing y Photo abiertos generan dos inputs de archivo asociados al mismo estado/ref.

La información automática de Decoration se sincroniza mediante efectos al montar/usar esa sección; no es una proyección central aplicada al confirmar. Las notas derivadas pueden quedar desactualizadas. Elegir None limpia referencias locales a archivos sin asegurar su descarte inmediato del almacenamiento.

Prioridad: separar estado de apertura de estado de selección y dar a cada acción interna una actualización explícita del modelo. Mantener accordions independientes como pide la UX, sin que su apertura determine accidentalmente el contenido final del pedido.

## F. Reglas del dominio y tipado

`model.ts` contiene compatibilidad de talla/ancho, diseños y validación básica. `tags.ts` centraliza Paw, Circle, Bone y Military con sus tamaños. Crown ya no aparece en frontend, pero sigue siendo una opción aceptada por el inventario SQL: falta una política común de disponibilidad.

Las dimensiones se muestran alto × ancho: por ejemplo Bone Medium 4 × 2.7 cm corresponde a height=4, width=2.7. Conservar esta convención y verificarla en pruebas evita invertir datos.

Los tipos de TypeScript son útiles y el proyecto compila en modo estricto. Eso no valida JSON de sessionStorage, respuestas RPC o solicitudes recibidas por el servidor. Hay conversiones de tipo y estructuras externas sin validación completa. `tsconfig` no cubre automáticamente toda la Edge Function, scripts y pruebas.

Faltan validaciones de dominio consistentes para decoración, iconos de información, email, categorías adicionales y coherencia de attachments con la modalidad elegida. Los campos estructurados nuevos necesitan límites, enums y normalización tanto en entrada como en SQL. No confiar en que el cliente solo envía opciones válidas.

## G. Backend real, datos y seguridad

### Qué está implementado

Hay un adaptador demo y otro Supabase. El modo depende de URL/key públicas; en ausencia de configuración puede funcionar como demo. El código implementa sesión anónima, catálogo, confirmación, recuperación por clave, archivos privados y producción autenticada. No se verificó un despliegue remoto en esta auditoría.

El esquema incluye `production_owner`, `sizes`, `size_widths`, `designs`, `design_compatibility`, `fonts`, `customers`, `orders`, `order_items`, `attachments` y `tag_options`.

La confirmación SQL es transaccional y valida identidad, tamaño del pedido/payload, datos principales, compatibilidad, diseños/fonts activos y propiedad de archivos. Usa hash y clave de idempotencia para proteger reintentos. Genera snapshots de cliente, diseño y tipografía. Producción dispone de estados new → inprogress → finished.

### Controles positivos

- RLS y permisos restringen escrituras directas; las operaciones sensibles pasan por RPC.
- Storage de attachments es privado; se usan URLs firmadas de corta duración.
- Las referencias de archivo se comprueban contra usuario, borrador y collar local.
- La Edge Function valida el JWT explícitamente incluso con `verify_jwt=false` en su configuración.
- Se verifican tamaño y firma de JPEG/PNG/WebP; límite de 10 MB.
- Las credenciales de servicio pertenecen a Edge/scripts; no se encontró una clave de servicio literal en el frontend revisado.

### Brechas y verificaciones pendientes

1. La confirmación no comprueba que `attachment.purpose` coincida con `personalization_type`. Puede aceptar una combinación semánticamente incorrecta.
2. Los nuevos datos estructurados e iconos se copian sin una validación equivalente a la de los campos originales.
3. La firma del archivo no equivale a decodificar completamente una imagen ni limita sus dimensiones/píxeles. La validación del navegador se puede evitar enviando solicitudes directamente.
4. El límite de pedidos por usuario anónimo no evita regenerar identidades; no se verificó protección adicional contra abuso.
5. Los snapshots copian metadata, pero apuntan a assets públicos que pueden cambiar en la misma ruta. No aseguran reproducción histórica exacta de la imagen/font.
6. Existe un script de limpieza de archivos huérfanos; no se verificó programación real ni una política completa de retención de pedidos/datos.
7. Faltan pruebas remotas de RLS, Storage, CORS, Edge, concurrencia y roles con la configuración desplegada.

No hay evidencia de checkout, pagos, cálculo comercial completo, envío o notificaciones. El módulo confirma selecciones y gestiona producción; no debe confundirse con una plataforma e-commerce completa.

## H. Errores, recuperación y casos límite

Hay reintento de catálogo, fallback de imágenes, estados de carga, mensajes de confirmación, recuperación idempotente y manejo de fallos de fuentes. Son controles útiles.

Pendientes:

- Recuperar borradores corruptos con una opción segura, sin bucle de recarga.
- Conservar contexto de subpasos y editar sin navegar a índices retirados.
- Diferenciar errores de red, validación y permisos para orientar al cliente.
- Resetear el estado de fallo de DesignImage si cambia su fuente.
- Evitar referencias huérfanas al descartar personalización; la limpieza posterior no sustituye la intención de descarte.
- Validar recuperación cuando el servidor confirma pero se pierde la respuesta. La clave actual ayuda, pero cambios posteriores regeneran la clave; el resultado pendiente no se persiste como operación independiente.
- Definir comportamiento de refresh tras confirmación: el pedido confirmado vive en estado de pantalla y no hay una recuperación persistente equivalente al borrador.

Los riesgos de respuesta perdida y recuperación deben probarse; no se reprodujo una duplicación de pedido durante esta revisión.

## I. Rendimiento y assets

Inventario medido: cinco fotografías editoriales suman aproximadamente 10.06 MB; dos imágenes de catálogo 5.85 MB; quince assets de iconos 3.49 MB; cuatro archivos Montserrat 805 KB. El directorio de tipografías de placas suma aproximadamente 1.35 MB. Esto es peso de archivos, no una medición de descarga efectiva en cada pantalla.

La construcción separa React/Supabase y carga PDF dinámicamente. Los chunks principales medidos fueron aproximadamente app 241 KB, Supabase 230 KB y PDF 436 KB sin gzip; con gzip 77, 73 y 180 KB respectivamente.

Prioridades: versiones de imagen adaptadas al tamaño de pantalla, formatos eficientes y revisar qué imágenes del carrusel se solicitan realmente. Algunos SVG contienen bitmaps; su extensión no garantiza ligereza. Preservar los trazados aportados por el usuario al optimizar assets.

Montserrat es local; Playfair Display se importa desde Google Fonts en CSS, lo que añade dependencia de red. La carga de lettering usa FontFace y caché; las fuentes reales se verificaron en la prueba de carga. Conviene revisar invalidación cuando cambia un asset sin cambiar versión.

No se midieron Core Web Vitals ni CPU/memoria en un iPad físico. No afirmar que la experiencia está optimizada solo porque el build pasa.

## J. Accesibilidad, responsive y UX

Existen botones nativos, foco visible, labels, aria-pressed/aria-expanded, cierre de modales con Escape, backdrop y retorno de foco, además de reduced-motion. Es una buena base.

Pendientes: semántica de progreso, asociación de errores al campo, navegación por flechas en controles que declaran tablist, relaciones completas entre encabezado/panel del accordion y auditoría de contraste/touch targets. No se declara cumplimiento WCAG sin medirlo.

Los accordions rotan el chevron y animan la entrada, pero desmontan directamente al cerrar: falta transición de colapso si se requiere apertura y cierre suaves.

`FittedLettering` mide ancho real y conserva la tipografía elegida; puede dividir nombres por espacios y manejar un mínimo legible. No debe sustituirse por conteo de caracteres. Sin embargo, TagFaces no comparte esa protección para todo su texto. Reproducción en 390 px: el área posterior de Bone tuvo altura visible 76 px y contenido 114 px con una dirección larga; el texto desborda.

Los estilos responsive siguen acumulando overrides. Para mantener paneles estables, revisar altura del shell por separado del contenido dinámico y usar pruebas comparativas de todos los pasos. No fijar dimensiones de screenshot ni escalar la página completa.

Revisar textos localizados: existen fragmentos/etiquetas derivadas en inglés. Cada pantalla debe respetar el idioma seleccionado, incluyendo datos adicionales, estados y exportación si corresponde.

## K. Pruebas y evidencia actual

| Verificación ejecutada | Resultado |
|---|---|
| TypeScript `tsc -b` | Aprobado |
| Unitarias actuales | 6/6 aprobadas; un archivo de dominio |
| Harness SQL permanente | 39 comprobaciones aprobadas; carga solo las tres primeras migraciones |
| Harness temporal con todas las migraciones actuales | 39 comprobaciones aprobadas; archivo temporal eliminado |
| Build / prueba estática bajo `/colti/` | Aprobado |
| Playwright actual | 4 aprobadas, 2 fallidas |
| Pruebas Supabase remoto | No ejecutadas; sin configuración de prueba real verificada |

Las dos fallas E2E son expectativas obsoletas: banner demo retirado y selector/paginación `.font-card` anterior. La carga de las 36 fuentes pasó antes de fallar la expectativa de UI. No prueban por sí mismas una avería del nuevo diseño, pero dejan rutas importantes sin cobertura efectiva.

Pasaron las pruebas de validación/recuperación, rutas/producción, manejo de catálogo vacío/imágenes y exportación larga. La prueba de captura desktop no compara contra una referencia visual aprobada; no detecta regresiones visuales automáticamente.

Los 39 checks con todas las migraciones prueban compatibilidad con casos existentes, no validación exhaustiva de extras y decoración nuevos. No debe interpretarse como cobertura completa del backend.

Cobertura necesaria: matriz next/back/progreso, restauración/migración de borradores, multi-collar, todos los modelos/tamaños, personalización cruzada, adjuntos por propósito, nombres/datos largos, idioma, offline/respuesta perdida, permisos reales y snapshots visuales desktop/tablet/mobile. No se encontró una puerta de calidad automatizada que haga obligatorias todas estas comprobaciones antes de publicar.

## L. Prioridades y plan incremental

### CRITICAL — corregir antes de producción

| Hallazgo | Acción |
|---|---|
| Selección de decoración puede guardar Photo | Separar apertura/selección y probar datos finales enviados |
| Reglas nuevas incompletas en servidor | Validar enums, categorías, límites y coherencia de archivos/modalidad |
| Borrador sin validación estructural suficiente | Parseo validado, migración y recuperación segura |
| Backend desplegado no verificado | Ejecutar pruebas con roles reales, RLS, Storage y Edge en staging |
| Pruebas del flujo obsoletas | Actualizar E2E y hacer que el flujo completo actual pase |

### SHOULD FIX — siguiente ciclo técnico

- Unificar motor de pasos, contador y progreso; retirar destinos heredados con migración.
- Corregir overflow de TagFaces con nombres/datos largos en todas las geometrías.
- Centralizar proyecciones de datos para review, resumen, producción y exportación.
- Consolidar tratamiento de errores, reintentos y archivos descartados.
- Verificar paridad de inventario frontend/SQL y disponibilidad de Crown.
- Añadir pruebas de campos nuevos y cargar siempre todas las migraciones en el harness.
- Establecer referencias visuales y checks de accesibilidad.
- Optimizar fotografías y assets sin cambiar su diseño.

### NICE TO HAVE — después de estabilizar

- Extraer StepHeader, ProgressBar, OptionCard y Accordion reutilizables conservando la UI.
- Documentar contratos de datos y reglas del producto junto a sus pruebas.
- Reducir overrides CSS mediante consolidación verificada visualmente.
- Medir Web Vitals, errores y tiempos de confirmación sin registrar datos personales innecesarios.
- Mejorar versionado histórico de imágenes y tipografías.

### Plan por entregas pequeñas

1. **Congelar la referencia aprobada.** Capturas de todos los pasos con datos simples y largos en desktop, tablet y mobile; inventario de contratos y comportamiento actual. Sin cambios visuales.
2. **Restaurar la red de seguridad.** Actualizar las dos pruebas obsoletas, cargar todas las migraciones y añadir los casos reproducidos de personalización y overflow. Criterio: flujo real completo aprobado.
3. **Corregir integridad.** Separar accordions de modalidad, actualizar acciones internas, validar borradores y campos nuevos; comprobar propósito de archivos en servidor. Criterio: lo visible coincide con review, payload y snapshot almacenado.
4. **Unificar navegación.** Introducir identificadores/configuración de pasos y migración de índices antiguos. Criterio: next/back, edición, refresh, contador y barra derivan de una sola fuente.
5. **Consolidar presentación de datos.** Proyecciones comunes para resumen/review/producción/exportación, con idioma y datos opcionales. Criterio: ningún campo se pierde o cambia de significado entre pantallas.
6. **Mejorar implementación sin rediseñar.** Extraer primitives y ordenar CSS gradualmente. Criterio: comparación visual contra referencias aprobadas sin cambios inesperados.
7. **Cerrar preparación de producción.** Pruebas remotas, abuso, recuperación de confirmación, limpieza programada, assets y rendimiento. Criterio: checklist documentado con evidencia del entorno desplegado.

No combinar todas estas entregas en una refactorización grande. Cada una debe tener cambios revisables, pruebas específicas y posibilidad de volver atrás. La primera corrección funcional recomendada es la incoherencia de personalización, acompañada de una prueba que inspeccione el dato final, no solo el aspecto del accordion.
