# Fase 24 — auditoría previa

La aplicación tiene Domain y Application independientes de Supabase. Los contratos están en `src/application/repositories.ts`; `src/data/backend.ts` es la composición existente. Order es la única entidad de pedido y conserva snapshots de diseño y fuente. Se reutilizarán las proyecciones, FontSample, attachments y Downloads. No se crea una segunda orden.

Faltan estados Ready/Delivered/Cancelled, nota privada, disponibilidad administrativa separada del sync y configuración persistente del hero. Supabase ya dispone de propietario, Auth, RLS y control optimista por updated_at. El sync Drive es de servidor/build, con fuentes de catálogo y hero separadas. La configuración se añadirá encima de estos assets, sin mover credenciales al navegador.

El modo demo guarda pedidos en sessionStorage y no autentica administradores: el Admin permanecerá cerrado sin Supabase configurado. No se inventarán credenciales ni se presentará el demo como seguridad real.

Plan: contratos administrativos específicos sobre el mismo Order; RPCs privados con control de concurrencia; shell independiente; reutilizar presentación y exports; disponibilidad adicional al catálogo/confirmación; configuración del hero sin modificar geometría. Tests de dominio, PostgreSQL/RLS y UI; luego regresión completa.

Las referencias Fase 22 preceden cambios aprobados de textos, cabecera y fotografías Drive. Se investigarán diferencias; no se actualizarán snapshots en masa. No modificar sources ni exportadores ni previews.
