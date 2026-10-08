# COLTI Admin / Production V1

## Revisión local disponible

Ejecutar `npm run admin:preview` y abrir `http://127.0.0.1:4174/admin/orders`. Es un servidor independiente enlazado a loopback, con aviso visible de demostración. Muestra un pedido de ejemplo, el catálogo sincronizado real y las imágenes del hero; los cambios de revisión se guardan únicamente en localStorage de ese origen.

El adaptador está en `scripts/admin-preview-backend.js`. Vite lo carga exclusivamente en modo `admin-preview`; un build con ese modo se rechaza. El build normal sigue usando Supabase y requiere propietario autenticado. Esta vista permite revisar la interfaz y no registra pedidos de producción.

## Activación

El Admin comparte la aplicación y la tabla `orders`. No transforma pedidos demo en pedidos reales. Sin Supabase configurado, todas las rutas administrativas permanecen cerradas. Las capturas de revisión emplean un adaptador exclusivamente de Playwright; no existe una contraseña demo ni una opción para saltarse Auth en el bundle.

1. Aplicar las migraciones existentes y `202610030004_admin.sql` en staging, antes de publicar el nuevo cliente.
2. Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. Nunca usar service role en estas variables.
3. Crear el usuario propietario mediante Supabase Auth y vincular su UUID en `production_owner`, mediante operación administrativa del servidor. No se crean credenciales en código.
4. Ingresar por `/admin/login`. Verificar acceso denegado con otra cuenta y con el cliente anónimo.
5. El hosting debe resolver `/admin/*` hacia `index.html`, igual que cualquier ruta SPA. Probar navegación directa y refresh de detalle.

## Pedidos

Orders consulta los mismos pedidos confirmados; páginas de 20, búsqueda y filtro en el servidor. Los datos del producto y la tipografía pertenecen al snapshot histórico. Los estados anteriores `finished` se interpretan como Ready sin reescribir datos históricos. Las transiciones administrativas son New → In progress → Ready → Delivered, y Cancelled desde los estados no terminales.

Status y nota se guardan mediante RPC con `updated_at` esperado. Si otra pantalla cambió la orden, se rechaza el guardado y se ofrece recargar. No hay borrado físico. La nota es un campo de la orden, leído exclusivamente por RPC de propietario; `order_document`, `find_order` y los exportadores existentes no la incluyen.

## Catálogo

Drive sigue siendo la fuente de diseños y assets. `catalog_availability` es una capa adicional, donde ancho 0 identifica el diseño completo. Cada override lleva una revisión. El sincronizador no modifica esta tabla. El cliente combina disponibilidad con las compatibilidades originales; el servidor vuelve a validarla al confirmar.

La confirmación bloquea los diseños en orden determinista y la modificación de disponibilidad utiliza los mismos registros: una desactivación concurrente y una confirmación no se aceptan de manera contradictoria. Un retry de una orden ya registrada conserva el contrato de idempotencia original, incluso después de desactivar su diseño. Históricos renderizan desde snapshots.

Un draft ya abierto puede conservar un catálogo anterior; si se intenta confirmar un diseño desactivado, recibe un mensaje para editar y seleccionar otra alternativa. Al recargar se obtiene la disponibilidad actual.

## Hero

La fuente semántica HeroImageSource usa el manifiesto generado por la sincronización de la carpeta independiente del hero. La tabla `hero_configuration` solo conserva IDs, active y orden del array, con revisión optimista; no almacena imágenes ni textos.

Para agregar archivos: subirlos a la carpeta Drive, ejecutar `sync:hero` con credenciales de servidor, generar el build y publicar assets/manifest. Después del sync, nuevas imágenes se agregan al final y activas por defecto. Archivos eliminados de la fuente no participan. Admin permite activar/desactivar y mover arriba/abajo, luego guardar. No implementa upload, borrado de Drive ni edición.

El hero público obtiene la configuración al cargar. Espera la lectura antes de elegir imágenes; en caso de fallo usa la fuente local sincronizada. Un conjunto totalmente desactivado conserva el panel y los textos sin fotografías. El layout, crop existente, overlays, crossfade y ocultamiento móvil se conservan.

## Verificación hosted pendiente

Las pruebas PostgreSQL locales ejecutan las migraciones reales y RLS, pero sustituyen Auth/Storage con un entorno de pruebas. Debe verificarse en staging: login real, creación de pedidos anónimos → listado del propietario, permisos REST directos, refresh de sesión, signed URLs y su renovación, dos conexiones concurrentes, reglas CORS, políticas Storage y routing del hosting. No se aplicaron migraciones a una instancia remota en esta fase.

La ruta Production anterior continúa como compatibilidad de la versión previa. Para gestión nueva se utiliza `/admin/*`; no se expone ningún enlace administrativo en la cabecera pública.

## Pedidos en la instalación local

El panel `http://127.0.0.1:4174/admin/orders` muestra los pedidos demo que realmente se generan en el configurador local, sin sembrar pedidos ficticios. La variable local `VITE_LOCAL_ADMIN_BRIDGE=http://127.0.0.1:4174` habilita la copia de pedidos y archivos desde 4173/5173; el servidor guarda los registros en `.asset-tools/private/`. Se recuperan los pedidos de la sesión abierta al refrescar el configurador. Las importaciones repetidas conservan estados/notas del administrador. No borrar esta carpeta si se necesita conservar los pedidos recuperados.

Esta conexión funciona únicamente en loopback y no se instala en producción. Para pedidos desde otros dispositivos y usuarios se debe configurar Supabase, aplicar las migraciones y usar su administrador privado. No publicar el modo admin-preview ni tratar los códigos DEMO como pedidos alojados.
