# Correcciones de traducción y descargas — 2026-10-03

## Antes / después
- Hero y encabezado de cliente: textos fijos EN → textos según idioma, sin cambios CSS ni geometría.
- Esterilización: Spayed / Neutered → Esterilizada / Castrado en ES. Los valores guardados siguen siendo los originales; textos personalizados se conservan.
- Tu collar N → Creando collar N (EN: Creating collar N).
- Tipografía: Fuente 36 → 36; PDF/JPG: Fuente / 36.
- Guardar orden demo → Realizar pedido, sin flecha en ES. El envío demo/real conserva su comportamiento; en EN se conserva Save demo order y se elimina la flecha. Reintentar conserva su comportamiento aprobado.
- Crear otra orden → Realizar nuevo pedido.
- PDF/JPG: nombre separado grande → Nombre dentro del bloque de cuatro campos, antes de Diseño, Talla/ancho y Tipo de collar. El nombre conserva su fuente real. Las pantallas y previews no cambian su estructura.

## Verificación
- Typecheck y build: pasan.
- Unitarias: 120 pasan, incluyendo traducción de esterilización sin mutar datos.
- Flujos completos EN/ES con Drive, Edit/Remove/Add, fuentes, Production, PDF/JPG: pasan.
- Resúmenes, responsive 320–1440, fuentes reales, descargas y thumbnails: pasan.
- Recovery: tres pruebas pasan después de conservar la flecha de Reintentar; la primera ejecución detectó ese cambio accidental y se corrigió.
- Hero: cuatro pruebas de estabilidad pasan.
- PDF: márgenes/paginación y Nombre antes de Diseño en la misma columna pasan.
- Nueva prueba del hero ES: pasa; captura revisada en artifacts/translation-copy-desktop-es.png. Su primera ejecución utilizó un nombre accesible incorrecto; corregido en el test.

## Referencias visuales
No se sobrescribieron las 120 referencias de Fase 22. Las referencias con los textos anteriores necesitarán una actualización explícita de copy antes de volver a considerar verde esa suite completa. La geometría se verificó mediante las pruebas de estabilidad y responsive; no se afirma una comparación pixel a pixel completa contra referencias de copy obsoleto.
