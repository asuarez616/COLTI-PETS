# Orders — tablero y seguimiento

Antes: listado de pedidos con búsqueda, estado y acciones dentro del detalle. Sin rango de fechas, tablero o motivo de cancelación.

Después: tablero New → In progress → Ready → Delivered, tarjetas arrastrables y control Move para teclado/móvil. Se conservan acciones del detalle. Historial Delivered/Cancelled, búsqueda y filtro por fecha de creación del pedido (ambos días incluidos). Cancelación con motivo opcional privado, persistido aparte de las notas y excluido del documento del cliente. Actualización automática cada 15 segundos mientras la página está visible.

Se conservan las transiciones existentes: no se permite saltar estados ni reabrir pedidos terminales. Cada columna carga 20 registros por página; un signo + indica más registros disponibles. Los contadores representan los registros cargados. El filtrado por fecha ocurre antes de paginar en ambos repositorios.

Validación: typecheck y build correctos; 145 unit tests; 9 E2E (tablero, arrastre, fecha, cancelación, persistencia, historial, responsive 1440/834/390, detalle/PDF/JPG, catálogo, hero, conexión Drive y recepción de pedidos locales); 53 comprobaciones PostgreSQL; prueba del servidor local con fechas, persistencia y motivo privado. Capturas en artifacts/admin. Las pruebas usan datos aislados; no cambian los pedidos reales de esta instalación. CSS del configurador conserva index-D70kjJbt.css.

Límite de despliegue: funciona en el panel local. La migración supabase/migrations/202610040001_order_board.sql está preparada y probada en PostgreSQL local; debe aplicarse cuando se conecte el Supabase de producción. No se configuró ni contrató Google Cloud. Los filtros usan la fecha de creación, no la fecha de entrega. El motivo se consulta al abrir el pedido cancelado.
