# COLTI PETS

Configurador web de collares personalizados para mascotas y herramientas de administración COLTI. Aplicación React, TypeScript y Vite; Supabase proporciona catálogo, autenticación y datos de producción.

## Instalación y arranque

### Windows

Clona el repositorio y ejecuta desde su carpeta:

~~~powershell
git clone https://github.com/asuarez616/COLTI-PETS.git
cd COLTI-PETS
Start-COLTI.cmd
~~~

El lanzador instala Node.js LTS si hace falta, prepara pnpm y las dependencias, y abre:

- Store: http://127.0.0.1:4176/
- Admin local: http://127.0.0.1:4174/admin/orders

Para detener los servidores, ejecuta `Stop-COLTI.cmd`. Los registros locales se guardan en `.colti-runtime/` y no se suben a Git.

Se necesita Windows Package Manager (`winget`) para instalar Node automáticamente. Si no está disponible, instala Node.js 22.12 o posterior y vuelve a ejecutar el lanzador.

### Otros entornos

Con Node.js 22.12 o posterior y pnpm 11.19:

~~~sh
pnpm install --frozen-lockfile
pnpm dev
~~~

El Store manual queda en http://127.0.0.1:5173/. Para compilar, ejecuta `pnpm run build`.

## Supabase

Los archivos locales de entorno no están en Git. Para conectar el Store, configura `.env.production.local` usando las variables del ejemplo en `.env.example`. La vista Admin local es una vista previa; el panel de producción requiere la configuración y autorización de Supabase. Nunca publiques claves secretas ni las añadas a variables `VITE_`.

## Estructura

- src/application y src/configurator: recorrido y experiencia de compra del Store.
- src/admin: interfaz de administración.
- src/ui e src/i18n: componentes visuales compartidos y traducciones.
- src/domain: reglas y validaciones del negocio.
- src/data e src/infrastructure: acceso a datos e integraciones.
- src/catalog, src/exports e src/production: catálogo, exportaciones y operaciones.
- public y reference-assets: identidad visual y recursos gráficos.
- supabase: migraciones, funciones y semillas de base de datos.
- scripts: tareas de desarrollo y herramientas locales.
- tests: pruebas automatizadas.
- docs y audits: guías operativas y documentación técnica del proyecto.

Más información operativa: docs/LOCAL_SITE_STARTUP.md y docs/admin.md
