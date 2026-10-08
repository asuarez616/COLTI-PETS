# Rediseño de Admin — solicitud del usuario

Se rediseñó exclusivamente la presentación de Admin. Se mantienen Playfair Display, Montserrat, el logo SVG existente y los tokens rosa/amarillo/crema del configurador.

- Orders: tarjetas con referencias del diseño, mascotas, cliente, contacto, fecha y estado; búsqueda/filtro en una barra; acción explícita para abrir.
- Detalle: collares a la izquierda y panel operativo con cliente, estado, nota y documentos. Panel fijo al desplazarse en desktop; reorganizado en tablet/mobile.
- Catálogo: imágenes grandes, disponibilidad sobre la imagen e interruptores accesibles por diseño/ancho; mensajes de guardado y resultados vacíos.
- Hero: galería de fotografías, posición visible, active/hidden, controles de orden y barra de guardado. Los cambios posteriores a guardar vuelven a mostrar Unsaved changes.
- CSS administrativo consolidado y limitado a `.admin`. No se tocaron el configurador, fuentes, reglas, repositorios, SQL ni exportadores.

Verificación: typecheck/build pasan; 143 unitarias pasan; 4 E2E Admin pasan (operaciones, exports, nota privada, recuperación, toggles y responsive 834/390 con imágenes fallidas). La prueba del hero se repitió tras añadir feedback de cambios pendientes y pasó. Preview local con catálogo Drive completo y 8 imágenes hero pasa sin page errors. Se revisaron capturas de las cuatro pantallas. El CSS público sigue generando `index-D70kjJbt.css`.

La primera prueba encontró dos links cuyo nombre accesible incluía el ID: ID del pedido y View order. Se ajustó el selector de prueba a coincidencia exacta; ambas acciones de navegación son válidas.

Vista local: http://127.0.0.1:4174/admin/orders. Continúa siendo una demostración explícita; no cambia el acceso Supabase de producción.
