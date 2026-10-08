# COLTI Configurator — Especificación implementable V1

Fecha: 2026-10-01. Mercado objetivo: COLTI USA. Documento de implementación, no de marketing.

## 1. Autoridad, referencias y decisiones pendientes

La solicitud actual de la dueña es la fuente de requisitos. Se revisó el contexto recuperable de la conversación «Crear catálogo COLTI USA» (6ab532fa-95c4-83e9-9ca3-36131acc7534), incluidos los dos diseños adjuntos. Si un dato no está confirmado, no convertirlo en una regla comercial. Las propuestas técnicas de este documento pueden implementarse; los TODO comerciales permanecen explícitos y no bloquean el prototipo.

Referencias locales, copiadas sin modificar los originales:

- `reference-assets/CH-17-1.png`: primera imagen, diseño tejido de prueba; el nombre del archivo aporta el código CH-17-1, pendiente de validación comercial.
- `reference-assets/design-test-02.png`: segunda imagen, diseño estampado de prueba según su apariencia; usar código técnico provisional `TEST-PRINTED-02`, sin atribuirle un código comercial real.
- Ambas imágenes incluyen collar terminado, diseño en crudo y paleta. No deducir de la foto el ancho, las tallas disponibles ni restricciones de broche.
- La lámina de referencia de tipografías 1–36 se menciona en la solicitud, pero no estuvo disponible entre los adjuntos recuperados. TODO no bloqueante: recuperar la lámina y los archivos de fuentes; no inventar su correspondencia.

Los datos del catálogo inicial son fixtures de prueba identificados como tales. No representan disponibilidad comercial definitiva. No editar archivos sincronizados bajo `sources/`.

## 2. Objetivo y resultado de V1

Construir una aplicación web donde una persona configure uno o varios collares mediante un recorrido visual de una pregunta por paso, revise la orden, la confirme y reciba un número COLTI-US y resúmenes descargables JPG/PDF. La orden debe quedar persistida en un backend real y disponible en un panel privado de producción para la dueña.

La V1 debe funcionar de extremo a extremo con los dos diseños de prueba, selección directa de talla/ancho y tipografías placeholder. La ausencia de catálogo completo, fuentes reales o reglas comerciales futuras no detiene ese recorrido.

## 3. Alcance y exclusiones

Incluido: datos del cliente, selección manual de talla/ancho, catálogo Woven/Printed filtrado, tres tipos de collar, dos tipos de placa, texto y personalización opcional, 36 opciones de tipografía numeradas, múltiples collares, revisión y edición antes de confirmar, adjuntos seguros, persistencia, numeración secuencial, JPG/PDF, panel de producción y estados, manejo de errores, accesibilidad y diseño responsive.

Fuera de V1 expresamente:

- Precios, cotizaciones, impuestos, descuentos, pagos y checkout.
- WhatsApp API, chatbot, envío automático de mensajes y notificaciones externas.
- CRM, campañas, segmentación, historial comercial de clientes y administración general de negocio.
- Recomendación automática de talla o algoritmo basado en cuello/peso.
- Importación masiva de Google Drive y sincronización automática con Drive.
- Reglas comerciales de compatibilidad todavía no confirmadas.
- Portal de cliente, edición pública de pedidos ya confirmados, inventario y gestión de envíos.

No pedir dirección, correo u otros datos comerciales que no fueron solicitados. El panel no necesita un editor de catálogo en V1: los datos se preparan mediante seeds/configuración controlada.

## 4. Arquitectura propuesta

- Frontend estático: React + TypeScript + Vite. Componentes visuales, estado del recorrido separado de los componentes y una capa de acceso a datos. Etiquetas en un diccionario EN/ES; default propuesto para USA: inglés, con equivalentes españoles disponibles en configuración.
- Backend: Supabase Postgres para datos, Storage para imágenes/adjuntos y Auth para sesión de cliente anónima y acceso de la dueña.
- Supabase Edge Functions y/o RPC transaccional para confirmar órdenes, validar entradas, reservar numeración y aplicar idempotencia. La confirmación no puede consistir en varias escrituras independientes desde el navegador.
- Generación de JPG/PDF desde el snapshot confirmado, usando un renderer compartido. Se propone generación en el navegador con librerías compatibles con build estático; la dueña puede regenerar los mismos documentos desde el detalle del pedido.
- Catálogo y fuentes se cargan como datos; imágenes y archivos de fuentes se sirven desde Storage. No codificar compatibilidades comerciales en JSX ni en componentes.

Separaciones sugeridas: `domain/` (tipos y validación), `data/` (repositorios/API), `configurator/` (estado y pasos), `catalog/`, `exports/`, `production/`, `i18n/`, `supabase/migrations/` y `supabase/seed/`. Entregar README, `.env.example`, migraciones reproducibles y semillas de prueba.

## 5. UX mobile-first, visual y conversacional

Una pregunta principal por pantalla. Textos breves, tarjetas grandes, imágenes visibles y selección inequívoca. No mostrar un formulario largo ni simular un chatbot con inteligencia artificial. El avance es un flujo determinista, con Atrás y Continuar, indicador de progreso dentro del collar y resumen contextual mínimo.

Flujo obligatorio:

1. Bienvenida breve y nombre del cliente.
2. Teléfono del cliente.
3. Talla del collar, con tabla de ayuda accesible.
4. Ancho: mostrar únicamente los anchos de la talla seleccionada. Si solo hay uno, presentarlo para aceptación sin pregunta redundante.
5. Diseño: tabs `WOVEN / TEJIDOS` y `PRINTED / ESTAMPADOS`, tarjetas filtradas y vista ampliada; confirmar con «Select this design / Elegir este diseño».
6. Tipo de collar.
7. Tipo de placa.
8. Nombre de mascota para la placa.
9. Teléfono para la placa; ofrecer usar el del cliente, manteniéndolo editable.
10. Datos extra opcionales, con acción Saltar.
11. Tipografía numerada con previews/placeholders explícitos.
12. Personalización opcional: sin personalización, decoración, dibujo o foto del perro; texto descriptivo y archivo cuando corresponda. Saltar debe ser posible.
13. Revisión del collar con acciones de editar y guardar en la orden.
14. Resumen de todos los collares: agregar otro, editar uno, eliminar uno o confirmar. Agregar otro conserva nombre/teléfono del cliente.
15. Confirmación persistida: identificador, resumen y descargas JPG/PDF.

Los pasos opcionales también se presentan de uno en uno. La revisión puede mostrar varios campos juntos. Al editar una selección anterior, conservar respuestas compatibles; si talla/ancho cambia y el diseño deja de ser compatible, invalidar únicamente esa elección y sus dependencias, explicando qué debe elegirse de nuevo. No perder otros collares.

La pantalla final debe aclarar que el pedido fue registrado, sin afirmar pago, precio, fecha de entrega ni disponibilidad definitiva. La confirmación valida la selección contra los datos habilitados para el prototipo.

## 6. Cliente y tabla exacta de tallas

Datos obligatorios del cliente: nombre y teléfono. Tratar teléfono como texto, preservar prefijo internacional y formato legible; no restringirlo a un número de EE.UU. No exigir OTP en V1. La validación comprueba presencia y un formato telefónico razonable, no la titularidad.

Las medidas canónicas se guardan en centímetros y el peso de referencia en kilogramos:

| Talla | Cuello (cm) | Ancho permitido (cm) | Peso de referencia (kg) |
| --- | --- | --- | --- |
| 2XS | 17–25 | 1.0 | 1–2 |
| XS | 22–35 | 1.0 / 1.5 | 2–4 |
| S | 25–40 | 1.5 / 2.0 | 3–6 |
| SM | 30–45 | 2.0 | 6–12 |
| M | 32–50 | 2.5 | 12–18 |
| ML | 35–55 | 2.5 / 3.0 | 19–25 |
| L | 40–60 | 3.0 | 26–35 |
| XL | 44–65 | 3.0 | 36–45 |
| 2XL | 47–70 | 3.0 | >46 |

Conservar literalmente estas referencias: no cerrar huecos ni resolver solapamientos del peso. El peso no participa en validación ni recomendación. No pedir peso/cuello como requisito del recorrido V1.

TODO no bloqueante: UI USA en pulgadas/libras y política de redondeo. Preparar conversión en una utilidad independiente, manteniendo cm/kg como fuente canónica; no construir un algoritmo de talla a partir de conversiones ni de esta tabla. V1 admite mostrar centímetros y la selección directa de talla y ancho.

## 7. Catálogo basado en datos

Cada diseño contiene UUID interno, código único, tipo `woven | printed`, imagen, estado activo, orden de visualización y compatibilidades explícitas por pareja talla/ancho. El código debe aparecer debajo de la imagen y en resúmenes de producción.

Semilla inicial: exactamente las dos imágenes de referencia. Clasificación propuesta de prueba: CH-17-1 en woven y TEST-PRINTED-02 en printed; documentar que la segunda clasificación/código son provisionales. Subir las imágenes a Storage y registrar sus rutas. No depender de rutas temporales locales ni de enlaces privados de Drive para servir el catálogo.

Para probar todo el flujo sin inventar disponibilidad real, la semilla puede habilitar ambos diseños en todas las parejas válidas de la tabla, con `is_test_data=true` y aviso de catálogo de prueba. Esta es una configuración de demostración, no una regla comercial. Mantenerla aislada y reemplazable. No activar estos fixtures como catálogo comercial sin revisión de la dueña.

Filtro: `design.active = true` y existencia de compatibilidad exacta con talla/ancho elegidos. Aplicar la misma validación en servidor al confirmar. Manejar pestañas sin resultados con explicación y acción para cambiar talla/ancho; nunca mostrar diseños incompatibles para llenar la galería. Cargar imágenes con placeholders, dimensiones reservadas, lazy loading y reintento ante error.

TODO no bloqueante: códigos oficiales del segundo diseño, clasificación definitiva, disponibilidad real por talla/ancho y sustitución de fixtures. Fase posterior: seleccionar imágenes estandarizadas existentes en Google Drive y copiar activos autorizados a Storage; no construir importación masiva en V1.

## 8. Tipo de collar y placa

Tipos de collar, con claves estables:

- `plastic_buckle`: Plastic Buckle / Broche plástico.
- `metal_buckle`: Metal Buckle / Hebilla metálica.
- `martingale`: Martingale.

Mostrar los tres en V1. No inferir incompatibilidad por talla, diseño o ancho a partir de imágenes. TODO no bloqueante: matriz comercial futura; reservar una capa de validación/configuración que pueda restringirlos cuando existan reglas confirmadas.

Tipos de placa:

- `hanging`: Hanging / Colgante.
- `anti_fall`: Anti-fall / Anticaída.

V1 solicita una de estas opciones; no añadir «sin placa» como decisión comercial no confirmada. Campos obligatorios: nombre de mascota y teléfono de placa. Datos extra opcionales como texto libre. Personalización opcional con tipo `none | decoration | drawing | dog_photo`, instrucciones de texto y adjuntos. Si se elige foto o dibujo aportado por el cliente, debe existir archivo listo antes de confirmar; permitir volver a «sin personalización». Para decoración, no inventar un catálogo de motivos: admitir una descripción o referencia aportada por el cliente.

TODO no bloqueante: restricciones de anticaída por ancho, medidas/formas/materiales de placa, límite comercial de caracteres, técnicas de grabado, motivos disponibles y alcance exacto de decoración. No prometer que la preview sea una simulación final de fabricación.

## 9. Tipografías 1–36

Crear 36 registros con números estables de 1 a 36, sin renumeración. La referencia de negocio es la lámina original; no asociar números a fuentes supuestas o equivalentes.

Modelo: número, etiqueta, `asset_path`, familia CSS interna, estado `placeholder | ready`, activo, versión y opcionalmente miniatura de referencia. Mientras falten archivos, las 36 opciones siguen seleccionables y se muestran con una fuente neutral común y el texto «Fuente N — placeholder; vista previa real pendiente». El nombre de mascota aparece en cada tarjeta, pero no se presenta esa fuente neutral como la fuente elegida. Guardar el número seleccionado y el estado placeholder en el snapshot y en las exportaciones.

Para fuentes reales: cargar archivos autorizados WOFF2/WOFF/TTF mediante FontFace o @font-face; esperar su disponibilidad antes de renderizar la preview/exportación; registrar errores por fuente y mostrar fallback identificado. La versión real debe renderizar dinámicamente el nombre de mascota de cada collar. Una selección no desaparece si falla la descarga de fuente.

TODO no bloqueante: lámina original, correspondencia exacta 1–36, archivos/licencias, soporte de caracteres y ubicación final. No generar previews ficticios ni sustituir con fuentes similares.

## 10. Estado de la orden y edición

Estado local: cliente + lista de collares + collar en edición + uploads + clave de idempotencia. Dar a cada collar un UUID local estable y posición. Cada collar conserva su propia talla, ancho, diseño, tipo, placa, textos, fuente y personalización.

Se puede agregar, editar y eliminar antes de confirmar; impedir confirmar con cero collares o con alguno incompleto. Editar datos del cliente una vez actualiza el resumen común; el teléfono ya personalizado de una placa no debe sobrescribirse silenciosamente.

Una orden confirmada es inmutable para el cliente en V1. No repetir preguntas del cliente al agregar un collar. Propuesta técnica: borrador en memoria/sessionStorage con versión de esquema; eliminar datos temporales al cerrar sesión/limpiar borrador. No conservar archivos binarios en storage del navegador ni prometer recuperación si la sesión se pierde.

## 11. Modelo de datos propuesto

Usar UUID para claves, FK, `timestamptz` en UTC, restricciones en servidor y migraciones versionadas. Etiquetas traducidas no son valores de enum. Campos técnicos propuestos:

| Tabla | Campos principales y relaciones |
| --- | --- |
| customers | id, owner_user_id → auth.users, name, phone, created_at, updated_at. Crear registro por orden/sesión si es necesario; no deduplicar por teléfono ni implementar CRM. |
| orders | id, customer_id → customers, owner_user_id, sequence_number bigint unique, order_code unique, idempotency_key, request_hash, status, confirmed_at, created_at, updated_at, customer_snapshot JSONB, schema_version. Unique(owner_user_id, idempotency_key). |
| order_items | id, order_id → orders, position, size_code, width_cm numeric, design_id → designs, collar_type, tag_type, pet_name, tag_phone, extra_text nullable, font_number → fonts, personalization_type, personalization_notes nullable, snapshot JSONB, created_at, updated_at. Unique(order_id, position). |
| designs | id, code unique, type, image_path, active, is_test_data, display_order, asset_version, created_at, updated_at. |
| design_compatibility | id, design_id → designs, size_code, width_cm numeric, created_at, updated_at. Unique(design_id, size_code, width_cm). |
| attachments | id, owner_user_id, draft_id, local_item_id, order_item_id nullable → order_items, bucket, object_path unique, original_filename, mime_type, byte_size, purpose, status (`pending | ready | linked | rejected`), created_at, updated_at. |
| fonts | number integer PK con CHECK 1..36, label, asset_path nullable, css_family nullable, state, active, asset_version, created_at, updated_at. |
| sizes / size_widths | Datos canónicos de la tabla: código, cuello mínimo/máximo, texto de peso de referencia y anchos válidos; pueden ser tablas o configuración de dominio compartida y validada por servidor. |

Snapshot de ítem: código/tipo/versión/ruta de imagen del diseño, talla/ancho, tipo de collar y placa, texto, número/estado/versión de fuente y referencias de adjuntos. Evita que un cambio posterior del catálogo altere un pedido confirmado. Conservar los assets referenciados por pedidos; desactivar diseños en vez de eliminarlos. El servidor calcula los snapshots desde datos validados, no confía en etiquetas enviadas por el cliente.

Buckets propuestos:

- `catalog-images`: lectura pública solo de imágenes de catálogo; escritura solo por administración/backend.
- `font-assets`: lectura pública de fuentes autorizadas; escritura solo por administración/backend.
- `order-attachments`: privado. Rutas generadas por servidor bajo usuario/borrador/UUID; no usar el nombre original como ruta.

Los JPG/PDF pueden descargarse sin persistir archivos duplicados: la orden y sus snapshots son persistentes y permiten regeneración. Si se decide conservar exportaciones, usar un bucket privado y registrar versión/estado de generación; nunca hacerlos públicos.

## 12. Confirmación, secuencia e idempotencia

Contrato propuesto `confirm-order`: recibe clave UUID de idempotencia, cliente, lista de ítems y IDs de adjuntos listos. Responde con UUID de orden, código, estado `new` y snapshot autorizado para resumen. No acepta código/estado/propietario calculados por el navegador.

Procedimiento:

1. Verificar JWT de sesión, payload, límites técnicos y propiedad/existencia de adjuntos.
2. Validar todos los ítems contra tallas/anchos, catálogo activo y fuentes disponibles, permitiendo placeholders identificados.
3. Canonicalizar payload y calcular hash. Mismo usuario + misma clave + mismo hash devuelve la orden existente; misma clave con payload distinto devuelve conflicto.
4. En una transacción, crear cliente, orden, ítems, snapshots y asociaciones de adjuntos; asignar número mediante secuencia Postgres y constraint único. Un fallo no deja una orden parcial.
5. Formatear código como `COLTI-US-` + número con mínimo cuatro dígitos: 1 → COLTI-US-0001, 9999 → COLTI-US-9999, 10000 → COLTI-US-10000.
6. Devolver éxito después de commit. Generar documentos a partir de la respuesta persistida.

Una secuencia garantiza unicidad y crecimiento, no ausencia de huecos tras fallos; no usar `count + 1`, timestamps ni contadores del frontend. Si se requiere numeración sin huecos en el futuro, tratarlo como TODO comercial independiente.

Proteger concurrencia con la restricción única de idempotencia; resolver carreras sin consumir dos órdenes. Guardar la clave antes del primer envío y conservarla en reintentos tras timeout. Resolver una respuesta perdida mediante endpoint que busque esa clave para el usuario actual, sin enumerar pedidos. Si falla la exportación después del commit, el pedido permanece registrado y se reintenta solo la exportación.

## 13. JPG y PDF

Ambos formatos incluyen: código y fecha de confirmación, cliente/nombre/teléfono, todos los collares en orden, miniatura y código del diseño, talla/ancho con unidades, tipo de collar, tipo de placa, nombre y teléfono de mascota, datos extra, número y estado de fuente, tipo/instrucciones de personalización y referencias de archivos.

Incluir miniaturas de foto/dibujo cuando sea posible; en todos los casos incluir nombre, tipo e identificador del archivo, accesible en el panel autenticado. No insertar URLs firmadas permanentes ni tokens en los documentos. Si la fuente es placeholder, imprimirlo explícitamente. No agregar precio, total, pago ni fecha de entrega inventados.

Usar un único modelo de resumen para pantalla/JPG/PDF. Esperar imágenes/fuentes antes de exportar; assets de catálogo con CORS adecuado para canvas. PDF multipágina con cortes entre bloques, márgenes y textos legibles. Para órdenes largas, entregar JPG paginados con el mismo código (`COLTI-US-0001-01.jpg`, etc.) en lugar de una imagen truncada; PDF único `COLTI-US-0001.pdf`. No omitir collares para caber en una página.

Ofrecer Descargar y Reintentar. Las descargas fallidas nunca provocan una nueva confirmación. Verificar con nombres largos, varios collares, acentos, fuente placeholder y adjuntos; no recortar textos ni exponer datos de otros pedidos.

## 14. Panel privado de producción

Ruta estática sugerida `/#/production`, con login Supabase Auth. Solo una cuenta de dueña autorizada; no habilitar registro público de administradores. Autorización por UUID/rol almacenado y controlado en servidor, nunca por un email o booleano editable en el navegador.

Pantallas mínimas:

- Listado paginado de pedidos: código, fecha, cliente, cantidad de collares y estado; filtro sencillo por estado.
- Detalle: cliente, todos los ítems, snapshots, miniaturas, adjuntos con enlaces firmados temporales y descargas JPG/PDF.
- Cambio de estado: `new` (New / Nuevo) → `in_progress` (In progress / En proceso) → `finished` (Finished / Terminado).

Servidor valida transición y autorización; UI muestra guardando/error/reintento. Propuesta V1: avance al siguiente estado, sin cancelación ni retroceso no solicitados. No incorporar funciones de CRM. `updated_at` refleja el cambio; proteger actualización concurrente con versión o comparación del estado esperado.

## 15. Seguridad y carga de archivos

Habilitar RLS en todas las tablas expuestas y políticas en Storage. Denegación por defecto. El frontend usa únicamente URL de Supabase y clave publishable/anon; la service-role key nunca aparece en código, build, variables VITE_, logs ni repositorio.

Propuesta de sesión pública: Supabase Auth anónimo, sin formulario de registro. Esto aporta un `auth.uid()` verificable por servidor; la cuenta anónima sigue siendo un cliente sin privilegios de administración.

Matriz mínima:

- Cliente: lectura del catálogo activo y metadatos de fuentes; carga solo en su espacio de borrador; confirmación solo por operación controlada; lectura del resultado propio mediante API acotada. No listar todos los pedidos ni leer datos de terceros; no modificar estado, número o órdenes confirmadas.
- Dueña: lectura de pedidos/clientes/ítems/adjuntos y cambio de estado autorizado. Acceso comprobado también en backend/RLS.
- Visitante sin sesión: ninguna lectura de datos personales ni carga de adjuntos.

No confiar en ocultar pantallas. Evitar INSERT/UPDATE directo de órdenes desde el cliente. Toda RPC SECURITY DEFINER debe fijar search_path, validar auth.uid(), minimizar grants y no exponer privilegios generales. Si una Edge Function usa service role, debe aplicar autorización explícita antes de cada operación; la key permanece como secreto del backend.

Para archivos, propuesta técnica inicial documentada y ajustable: JPEG/PNG/WebP, máximo 10 MB por archivo, hasta 3 adjuntos por collar. Estos límites son de seguridad del prototipo, no reglas comerciales de personalización. Validar tamaño, tipo real/contenido y pertenencia en servidor; rechazar ejecutables, HTML y SVG activo. No confirmar archivos pendientes o rechazados. Los límites globales de request/cantidad de ítems también deben ser finitos y documentados en configuración técnica.

Upload por URL firmada corta o política restringida al usuario y borrador; nombre aleatorio, sin sobrescritura de otros archivos. Registro pasa a ready solo tras verificar objeto. Asociar exclusivamente archivos del mismo usuario e ítem. Lectura mediante URLs firmadas de corta duración emitidas tras autorización. Sanitizar texto/nombres, escapar HTML y no registrar teléfonos/fotos en telemetría. Limpiar borradores huérfanos según retención técnica documentada, excluyendo adjuntos ligados a pedidos; TODO: política definitiva de retención/privacidad. Aplicar límites de frecuencia para confirmación y uploads.

## 16. Validación, estados y recuperación

Cada paso tiene estado vacío, válido o inválido y mensaje cercano al control. Validación técnica de longitudes/tipos en cliente y servidor; límites técnicos no se presentan como límites de grabado comerciales. Conservar entrada del usuario tras error.

Modelar estados explícitos: catálogo `loading | ready | empty | error`; archivo `uploading | ready | error`; confirmación `idle | validating | submitting | confirmed | error`; exportación `idle | generating | ready | error`.

Deshabilitar confirmación durante envío y uploads; una sola operación en vuelo, apoyada por idempotencia de backend. Mostrar progreso y reintento sin inventar porcentajes. Ante timeout de confirmación consultar el resultado propio antes de enviar otra orden. Ante catálogo cambiado, señalar el collar afectado y volver al paso relevante sin borrar el resto. No usar un mensaje genérico de éxito antes del commit.

La pantalla final debe mantener el código visible aunque falle JPG/PDF. Errores de autenticación del panel permiten iniciar sesión de nuevo. Sin conexión, conservar borrador disponible y permitir reintentar; no implementar cola offline que confirme pedidos automáticamente.

## 17. Responsive y accesibilidad

Diseñar desde 360 px de ancho; comprobar también 320 px, tablet y escritorio. Sin scroll horizontal ni textos/códigos cortados. Controles táctiles de al menos 44 px, contraste legible, foco visible, navegación por teclado, labels reales y mensajes anunciados con aria-live cuando proceda.

No depender solo del color para selección/error. Imagen ampliada accesible, cierre claro y regreso al foco original. Tarjetas seleccionadas con texto/marca; textos alternativos describen diseño/código. Tipografías en galería paginada o carga progresiva, sin volver el paso un formulario masivo. Respeto de reduced-motion; no requerir animaciones para comprender el recorrido.

## 18. Hosting estático y configuración

Preparar build para GitHub Pages y dominio/subdominio COLTI personalizado, sin servidor Node en el hosting. Usar hash routing para configurador/panel y rutas de assets compatibles con base configurable del repositorio; probar recarga de la ruta privada. API, Auth y Storage viven en Supabase.

`.env.example` debe documentar: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (o anon según configuración), `VITE_BASE_PATH`, `VITE_DEFAULT_LOCALE` y modo visible de catálogo de prueba. Estas variables públicas no contienen secretos. Documentar por separado secretos backend, URL pública del sitio, origins permitidos/CORS y URLs de redirección Auth para localhost, Pages y dominio final.

Entregar procedimiento de build/deploy y configuración de CNAME/DNS/HTTPS, sin inventar el dominio real ni publicar sin solicitud. Usar URLs de Storage accesibles y no embeds de Drive. TODO no bloqueante para prototipo: repositorio, dominio/subdominio y cuenta Supabase definitivos. Si faltan credenciales, implementar migraciones y configuración completas y declarar que la prueba contra Supabase real está pendiente; un mock no equivale a persistencia validada.

## 19. Plan por fases

### Fase 1 — Prototipo end-to-end completo

1. Crear estructura, tipos de dominio, tabla exacta de tallas, diccionario y máquina de pasos.
2. Migraciones Supabase, RLS, buckets, cuenta dueña, catálogo de dos fixtures y 36 fuentes placeholder.
3. Recorrido completo, uploads, múltiples collares y revisión/edición.
4. Confirmación transaccional, numeración e idempotencia; resumen JPG/PDF.
5. Panel privado y estados; validación funcional, de seguridad y móvil.
6. Build estático verificable y documentación para conectar Supabase/Pages.

### Fase 2 — Datos reales y refinamiento

Sustituir fixtures con catálogo real e imágenes estandarizadas de Drive, sin importación masiva en V1; incorporar archivos reales de fuentes y su lámina; aplicar solo reglas de compatibilidad confirmadas; mejorar previews y diseño visual; definir presentación pulgadas/libras. No activar recomendación automática de talla, precios o pagos como consecuencia implícita de esta fase.

## 20. Registro de TODO no bloqueantes

| Pendiente | Comportamiento V1 |
| --- | --- |
| Algoritmo/recomendación de talla | Selección directa de talla/ancho; pesos solo referencia. |
| Pulgadas/libras y redondeo | Persistir y mostrar cm/kg canónicos; utilidad futura separada. |
| Compatibilidad comercial del catálogo | Fixtures identificados, parejas configuradas en datos, validadas en servidor. |
| Segundo código/tipo oficial | Código técnico TEST-PRINTED-02 y clasificación de prueba declarados. |
| Incompatibilidades de broches/Martingale | Tres opciones disponibles; no inferir restricciones. |
| Anticaída por ancho y reglas de placa | Dos opciones disponibles; no inventar restricción ni grabado final. |
| Lámina y fuentes reales 1–36 | Numeración estable y placeholders explícitos en UI/exportación. |
| Decoraciones y especificaciones de fabricación | Texto/referencia opcional sin catálogo de motivos inventado. |
| Catálogo completo/Drive | Dos imágenes copiadas a Storage; integración posterior. |
| Retención/privacidad definitiva | Adjuntos privados, límites y limpieza técnica documentados. |
| Dominio, repo y credenciales finales | Configuración por entorno y documentación; declarar verificaciones pendientes. |

## 21. Criterios de aceptación verificables

- [ ] El proyecto se instala y genera un build estático según README; `.env.example` no contiene secretos.
- [ ] Las nueve tallas y todos sus valores coinciden exactamente con la tabla de este documento.
- [ ] XS permite 1.0/1.5; S permite 1.5/2.0; ML permite 2.5/3.0; no se acepta una pareja inválida en cliente ni servidor.
- [ ] El recorrido móvil muestra una pregunta por paso y permite Atrás sin pérdida de respuestas compatibles.
- [ ] Solo se piden nombre y teléfono como datos iniciales del cliente; agregar otro collar no vuelve a pedirlos.
- [ ] Dos imágenes reales de prueba se cargan; tabs, ampliación, código, filtro y estado vacío funcionan.
- [ ] Desactivar un diseño o retirar una compatibilidad en datos cambia los resultados sin modificar componentes; servidor rechaza selección obsoleta.
- [ ] Los tres tipos de collar y las dos placas están disponibles sin restricciones comerciales inventadas.
- [ ] Texto extra y personalización se pueden omitir; uploads muestran progreso/error/reintento y persisten asociados al ítem correcto.
- [ ] Las 36 fuentes son seleccionables por número, todas marcadas como placeholder mientras falten archivos; no se muestra una equivalencia inventada.
- [ ] La arquitectura puede cargar un archivo de fuente de prueba autorizado y renderizar el nombre dinámico, sin asignarlo falsamente a la lámina 1–36.
- [ ] Dos collares distintos en una misma orden conservan sus selecciones; editar/eliminar uno no altera el otro.
- [ ] No se puede confirmar una orden vacía, incompleta o con archivos pendientes/rechazados.
- [ ] La confirmación persiste cliente, orden, ítems y adjuntos de forma consistente; un fallo transaccional no deja pedidos parciales.
- [ ] El primer pedido de una base de prueba limpia produce COLTI-US-0001; dos confirmaciones concurrentes tienen códigos únicos.
- [ ] Doble clic, reintento y timeout con misma clave producen una sola orden; misma clave con contenido distinto devuelve conflicto.
- [ ] JPG y PDF reflejan todos los campos requeridos y todos los collares, con miniaturas y placeholders identificados; un caso largo se pagina sin cortes de contenido.
- [ ] Fallar/reintentar exportación conserva el número y no crea un pedido adicional; la dueña puede regenerar documentos.
- [ ] El panel exige autenticación y cuenta autorizada, lista/detalla pedidos y permite New → In progress → Finished con validación backend.
- [ ] Prueba con dos sesiones de cliente: A no puede leer/listar los pedidos, clientes o adjuntos de B, ni modificarlos; tampoco puede cambiar su propio estado/número.
- [ ] Una sesión de cliente autenticada anónima no puede asumir el rol de dueña; ocultar UI no es el mecanismo de seguridad.
- [ ] Storage rechaza carga fuera de la ruta autorizada, archivos inválidos y exceso de tamaño; adjuntos privados no responden por URL pública.
- [ ] RLS está habilitado, RPC/funciones tienen autorización y el build/repositorio no contiene service-role key.
- [ ] Casos de catálogo vacío, fallo de imagen, fuente no cargada, upload fallido, timeout y pérdida de conexión permiten recuperación sin perder la orden en edición.
- [ ] A 320/360 px no hay desbordamiento; controles, foco, teclado y mensajes son utilizables; tablet/escritorio también funcionan.
- [ ] La aplicación funciona bajo base path de Pages y dominio raíz con rutas hash; refrescar el panel no produce 404.
- [ ] No aparecen precios/pagos, WhatsApp, CRM, importación masiva, recomendación de talla o promesas comerciales pendientes.

Pruebas mínimas de implementación: unitarias para parejas talla/ancho y validación; integración en Supabase para transacción, concurrencia, idempotencia y RLS entre usuarios; recorrido end-to-end de dos collares con edición/upload/exportación y cambio de estado por dueña; revisión visual del JPG/PDF y de pantallas móviles. Registrar qué se probó realmente y qué requiere credenciales o datos reales, sin presentar mocks como backend verificado.

## 22. Instrucción de ejecución para Codex

Implementa la Fase 1 de esta especificación. Usa los dos assets locales como seed de catálogo de prueba y los números 1–36 como fuentes placeholder explícitas. Mantén reglas y catálogo en datos, confirma órdenes en servidor con idempotencia y entrega un recorrido completo antes de refinar el aspecto visual. No agregues funciones fuera de alcance ni resuelvas TODO comerciales con suposiciones. Entrega código, migraciones/seeds, configuración, README y evidencia de criterios de aceptación; señala únicamente las verificaciones que de verdad quedaron pendientes.
