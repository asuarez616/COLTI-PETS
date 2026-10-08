# Catálogo desde Google Drive

La configuración vive en `catalog-drive-sources.json`:

| Colección | Tallas |
| --- | --- |
| Estampados | Todas |
| Tejidos grandes | M, ML, L, XL, 2XL |
| Tejidos medianos | S, SM |
| Tejidos pequeños | 2XS, XS |

Se recorren las subcarpetas, todas las páginas de resultados y solamente PNG, JPEG y WebP. Un archivo corresponde a un diseño; su nombre sin extensión es el código. Los sufijos como `-1` se conservan como variantes independientes. Los identificadores se mantienen al renombrar un archivo. Las carpetas vacías son válidas; no se prestan diseños de otro grupo de tallas.

## Conexión permanente

La conexión de Google Drive del chat permite importar el catálogo inicial. Para sincronizar desde el servidor o un ordenador sin el chat, habilitar Drive API en Google Cloud, crear una cuenta de servicio y darle acceso de **lector** a las cuatro carpetas. Guardar su JSON fuera del proyecto y configurar `GOOGLE_APPLICATION_CREDENTIALS` con la ruta absoluta. Alternativamente se admite `GOOGLE_DRIVE_ACCESS_TOKEN` temporal. Nunca usar variables `VITE_` para estas credenciales ni subirlas al repositorio.

La API oficial se consulta con `parents`, `trashed = false` y `nextPageToken`: https://developers.google.com/workspace/drive/api/reference/rest/v3/files/list

Requisitos: Node 22+ y Python con Pillow. Configurar `PYTHON_BIN` si Python no está en PATH.

```
npm run sync:drive -- --dry-run
npm run sync:drive
npm run build
```

La primera operación verifica y cuenta los archivos sin escribir cambios. La segunda descarga los nuevos o modificados y genera imágenes WebP de 240, 480 y 800 px, la compatibilidad por talla y el catálogo local. La tercera actualiza la página local. Los errores de lectura o descarga detienen la actualización. No se borra ni modifica ningún archivo en Drive.

## Publicación con Supabase

Aplicar la migración `202610030003_drive_catalog.sql`. Configurar solamente en el servidor `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.

```
npm run sync:drive -- --publish
```

Primero sube las imágenes a `catalog-images`; después actualiza diseños y compatibilidades en una transacción. Los diseños retirados se desactivan, preservando sus referencias e información histórica de pedidos. El modo conectado consulta el catálogo publicado de Supabase; el modo local usa la copia sincronizada de Drive. Los pedidos locales siguen identificados como demostración.

La sincronización es manual. El mismo comando se puede ejecutar desde un programador del servidor cuando se configure su frecuencia. No se ha creado ninguna tarea recurrente ni se han guardado credenciales de Google o Supabase.

## Hero desde Drive
Carpeta: https://drive.google.com/drive/folders/16Q_3gKdcfWak3jq_yzw-byXmpxOFyBWy

Ejecutar `npm run sync:hero` y luego `npm run build`. Usa las mismas credenciales de lectura que el catálogo; dar acceso de lector también a esta carpeta. Admite PNG/JPEG/WebP y ordena por nombre. Descarga nuevos/modificados, genera variantes responsive y reemplaza el manifiesto solo cuando todas las fotos se procesaron correctamente. Una carpeta vacía o un error conserva el hero publicado. Los archivos usan una versión por contenido para evitar imágenes antiguas en caché. Las imágenes iniciales 0–4 conservan sus posiciones y focales aprobados; nuevas imágenes usan focal centrado. No cambia geometría del hero ni se mezcla con el dominio de pedidos. Si falla una imagen en el navegador se usa una foto local de respaldo. La sincronización sigue siendo manual; no hay tarea automática configurada.
