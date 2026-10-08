# Valores visuales aprobados

El punto de entrada es `src/design-tokens.css`, importado antes de los estilos existentes. Los tokens conservan los valores exactos: no se convirtió la escala a rem, no se unificaron tonos distintos y no se redondearon medidas.

## Grupos

| Grupo | Tokens / uso |
|---|---|
| Colores | ink, muted, cream, line, brand-pink/yellow/deep, accent, surface-selected/soft. |
| Fuentes | font-body (Montserrat con los mismos fallbacks), font-heading (Playfair Display con los mismos fallbacks). Las 36 fuentes del nombre siguen en su catálogo. |
| Tipografía | font-size-8/9/10/11/12/13/14/15/16/18/24 para valores repetidos adoptados en UI. Los tamaños clamp y específicos se conservan en cada componente. |
| Spacing | space-4/6/8/10/12/14/16/18/20/24/28/32. Las medidas pt y los calc específicos aprobados no se convierten. |
| Bordes y radios | border-subtle y radius-6/8/10/12. No se igualaron radios que eran diferentes. |
| Controles | control-min-height 44px y action-min-height 52px. |
| Movimiento | transition-fast .2s; disclosure-duration 180ms y su curva existente. Reduced motion se conserva. |
| Lettering rápido | lettering-quick-size 35 y lettering-quick-size-28 45, valores unitless requeridos por FittedLettering. Solo afectan al selector rápido. |

No usar un token para mezclar dos valores que antes eran diferentes. El layout por modelo de tag sigue siendo responsabilidad de tagPreviewConfig; no se trasladó a este archivo. El hero conserva sus reglas específicas.

## Registro de breakpoints

Los límites vigentes son 360, 380, 400, 440, 600/601, 800/801 y 1199/1200 px. Las condiciones por orientación y reduced motion siguen intactas. Las queries completas, en orden de aparición único, son:

- `(min-width:1200px)`
- `(max-width:800px)`
- `(max-width:380px)`
- `(prefers-reduced-motion:reduce)`
- `(min-width:801px)`
- `(max-width:1199px)`
- `(max-width:600px)`
- `(min-width:601px) and (max-width:1199px)`
- `(min-width:801px) and (max-width:1199px)`
- `(max-width:440px)`
- `(min-width:801px) and (max-width:1199px) and (orientation:portrait)`
- `(min-width:601px)`
- `(max-width:360px)`
- `(max-width:400px)`

Los breakpoints se documentan aquí como registro compartido, pero permanecen literales en las media queries. CSS custom properties no funcionan como límites de @media; reemplazarlas por var(...) rompería responsive. No se añadió un preprocesador ni se reordenaron bloques para hacerlos parecer más limpios.

## Cascada y controles

La importación continúa: tokens → styles → editorial → interactions → accessibility → ui-corrections. No se introdujeron cascade layers ni se cambiaron especificidades.

Se consolidó el bloque de filas del preview en ui-corrections usando sus declaraciones finales: mismo icono, tamaño, espacio, line-height y transform. Los overrides de geometría del hero y los condicionados por viewport permanecen separados.

Antes de modificar un valor: reproducir el caso, identificar su alcance, ejecutar `npm run test:visual` y revisar las diferencias. Las referencias se actualizan solo con autorización explícita sobre el diseño. Una actualización de tokens que cambie una captura es un cambio de diseño, no una limpieza.

La auditoría de FASE 23 (`node scripts/audit-css-phase23.mjs`) compara esta fase contra el CSS anterior archivado; es evidencia histórica y no autoriza futuros cambios de apariencia.
