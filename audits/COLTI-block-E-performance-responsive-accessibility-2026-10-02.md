# COLTI — Bloque E: fases 17–19
Fecha: 2026-10-02. Alcance: rendimiento, responsive y accesibilidad. Se conservan imágenes, encuadres, selección, datos y lenguaje visual. No se inició ninguna fase posterior ni se publicó en producción.

## Fase 17 — Performance y assets
Medición antes/después sobre la compilación local, Chrome, caché nueva, desktop 1440×900 y móvil 390×844. Se contabilizan cuerpos de recursos; no son bytes completos de protocolo ni tráfico real de usuarios. Evidencia detallada: [tabla](../artifacts/block-e/comparison.md), [antes](../artifacts/block-e/performance-before.json), [después](../artifacts/block-e/performance-after.json).

| Recurso / carga | Antes | Después |
|---|---:|---:|
| Cinco fotografías, archivos a resolución completa | 10.06 MB | 6.91 MB |
| Dos imágenes de catálogo, resolución completa | 5.85 MB | 3.06 MB |
| Fuentes UI normal + italic | 798 KB | 254 KB |
| 36 fuentes activas de lettering | 1276 KB | 1003 KB |
| SVG Martingale con bitmap | 1956 KB | 842 KB |
| Publicación completa dist | 22.33 MB | 20.25 MB |
| Carga inicial desktop | 10.78 MB / 13 solicitudes | 2.04 MB / 10 solicitudes |
| Carga inicial móvil | 715 KB / 7 solicitudes | 447 KB / 7 solicitudes |
| Primera miniatura desktop | 3210 KB | 315 KB |
| Primera miniatura móvil | 3210 KB | 87 KB |
| Carga acumulada hasta catálogo desktop | 13.99 MB | 4.57 MB |
| Carga acumulada hasta catálogo móvil | 3.93 MB | 0.53 MB |

WebP lossless: 15 variantes editoriales (480, 800, original) y 8 de catálogo (240, 480, 800, 1254). Las versiones completas verifican igualdad de cada píxel RGB frente a los originales. Las pequeñas son reducciones proporcionales, sin recorte. La tabla de archivos completos no incluye todas las variantes; el total dist sí incluye el conjunto publicado. Los originales permanecen en public como respaldo; únicamente se excluyen duplicados conocidos de la salida compilada.

El hero conserva su geometría y crop: carga la fotografía actual y la siguiente, en lugar de las cinco al inicio; las demás se incorporan al navegar. Móvil no descarga fotografías editoriales. srcset/sizes se calculan con el área real de cobertura. DesignImage usa dimensiones intrínsecas, decodificación asíncrona, miniaturas lazy y preview eager sin recorte. Archivos desconocidos conservan su ruta.

Martingale conserva geometría, filtro y píxeles: su bitmap embebido cambia únicamente a WebP lossless, sin reinterpretar el icono. No se aplicó una rasterización pequeña porque no conservaba suficiente fidelidad. Las fuentes se convierten a WOFF2 sin subsetting, comprobando cmap, métricas y contornos de todos los glifos. Las 36 fuentes seleccionables mantienen su identidad; las muestras fuera de pantalla cargan al aproximarse.

Production y la entrada de exportación se cargan bajo demanda. PDF continúa separado. El chunk principal pasó de 264.25 a 265.38 KB; no se afirma una reducción de JavaScript. En la demo el fragmento Supabase de 1.22 KB contiene helpers, no el SDK completo. Una compilación separada con configuración pública ficticia mide el SDK real en 125.10 KB (34.54 KB gzip); ese perfil no contacta un backend. El catálogo conectado sigue necesitando su infraestructura al cargar.

Los assets remotos nuevos solo se activan cuando asset_version es responsive-v1. upload-catalog publica primero originales y variantes y después la marca; no fue ejecutado contra Supabase. Los catálogos remotos antiguos y sus fuentes siguen usando las rutas originales. PDF/JPG utilizan la imagen local completa lossless, sin reducir su resolución.

LCP observado: desktop 392→328 ms; móvil 288→356 ms. Son muestras de laboratorio fluctuantes, con CSS externo de Google todavía presente; no justifican afirmar mejora estadística de LCP. CLS inicial observado permanece 0.000687 desktop y 0.000404 móvil. No se midió INP de campo. El favicon 404 preexistente se excluye del control de assets de aplicación.

Reproducción: scripts/measure-performance.mjs y scripts/report-block-e.mjs; conservar el JSON anterior para comparar. Generación: scripts/optimize-images.py (Pillow 12.3), scripts/optimize-fonts.py (fontTools 4.66.1, Brotli 1.2). Son dependencias de generación, no del navegador.

## Fase 18 — Responsive real
Se recorrió el flujo completo en seis viewports de Chrome:

| Perfil | Viewport |
|---|---|
| Desktop | 1440×900 |
| Laptop | 1366×768 |
| iPad portrait simulado | 834×1194 |
| iPad landscape simulado | 1194×834 |
| Mobile | 390×844 |
| Mobile estrecho | 320×740 |

Cobertura: cliente, teléfono, talla, ancho, catálogo y modal, cierre, Hanging, Bone + tamaño conjunto, nombre, teléfono de placa, extra details, lettering/modal, Decoration, Drawing/upload, Photo/upload, review 11/11, orden, añadir collar, confirmación demo y Production. Se mantiene la selección automática de tamaños únicos y el salto condicional de Anti-fall.

Caso difícil: Maximiliano Rodriguez, dirección larga, datos médicos cerca del límite, teléfonos adicionales, family contact, email largo y Spayed/Neutered. Quince combinaciones adicionales prueban Paw, Circle, Bone, Military y Anti-fall en 390, 834 y 1440 px. Las comprobaciones no detectan overflow horizontal. FittedLettering sigue midiendo texto real; no se reemplazó por conteo de caracteres. El preview conserva su scroll interno existente para contenido extremo.

42 capturas críticas se guardan en artifacts/block-e: siete estados por viewport, con sufijos catalog-modal, extras, lettering-modal, decoration, review, order y production. Las capturas esperan fuentes y transiciones reales antes de tomar la imagen. Ejemplos: [desktop review](../artifacts/block-e/desktop-review.png), [móvil Decoration](../artifacts/block-e/mobile-decoration.png), [portrait order](../artifacts/block-e/portrait-order.png).

Las pruebas previas de estabilidad del hero y expansión/cierre siguen pasando en cuatro anchuras; no se cambió object-position ni proporción de columnas. No se escala globalmente la página. Se añade margen de scroll a campos en viewports cortos y se prueba 390×400 para verificar que campos y Continue siguen alcanzables.

Limitaciones: simulación de viewport en Chrome, no dispositivos iPad físicos. WebKit no está instalado; Safari no se valida ni se afirma equivalencia. El viewport corto no reproduce un teclado virtual real. La presentación estética del contenido extremo dentro de TagPreview queda para revisión visual posterior, sin rediseñarlo en este bloque.

## Fase 19 — Accesibilidad
Cambios:
- ProgressBar informa el mismo progreso semántico del motor, incluido aria-valuetext.
- Errores asociados a inputs mediante aria-describedby / aria-invalid, incluidos uploads.
- Tabs con roving tabindex, relaciones tab/tabpanel y navegación Arrow, Home y End.
- Modal central reutilizado por catálogo y lettering: diálogo nativo, nombre accesible, Escape, backdrop, contención de Tab/Shift+Tab y devolución del foco.
- Alt del producto localizado; iconos decorativos excluidos del árbol accesible.
- Cierre de modal y navegación con objetivos de 44 px; acciones de texto de al menos 24 px. Los campos permanecen alcanzables con altura reducida.
- Se conservan accordion header/chevron, aria-expanded, aria-controls, inert, independencia del estado de selección y reduced-motion.

Se completa el flujo principal solo con teclado. Axe 4.10.3 analiza seis estados: error inicial, Decoration móvil, modal catálogo, review, orden final y confirmación. Se guardan resultados JSON, dimensiones de objetivos visibles y árboles accesibles YML en artifacts/block-e/a11y-* y tree-*. Se espera el fin de animaciones para medir colores finales; no se usa un retraso arbitrario.

No aparecen infracciones automatizadas fuera de las siguientes combinaciones de contraste aprobadas que requieren revisión visual:

| Elemento | Ratio medido | Referencia para texto pequeño |
|---|---:|---:|
| Selector de idioma en header rosa | 3.36:1 | 4.5:1 |
| Enlace Production en header rosa | 4.21:1 | 4.5:1 |
| Eyebrows YOUR COLLAR / YOUR TAG del review | 4.00:1 | 4.5:1 |

No se cambiaron estos colores silenciosamente. Propuesta para revisión posterior: oscurecer ligeramente el texto del header y el magenta de esos labels pequeños, manteniendo los acentos de marca. El error, medido al finalizar su transición, no mantiene el fallo aparente encontrado durante el fade. Texto principal/crema mide 13.44:1; muted/crema 5.41:1; texto/CTA amarillo 7.67:1. El pastel de iconos es decorativo y no comunica por sí solo selección.

Los tests impiden nuevas infracciones ajenas a los selectores de contraste documentados. No constituyen certificación WCAG. No se probaron NVDA, VoiceOver ni teclado virtual físico; tampoco todos los posibles estados con tecnología asistiva. Los contrastes anteriores permanecen como deuda explícita.

## Regresión y alcance
Validaciones: TypeScript y build, 111 pruebas unitarias, 54 comprobaciones SQL locales y 48 pruebas E2E. Incluyen dominio/paridad, drafts anteriores, shape+size, hero estable, apertura y cierre suaves/reduced-motion, foco, uploads, recuperación/idempotencia demo, edición de múltiples collares, Production y PDF/JPG.

La prueba de compilación estática recorre los assets publicados, las 36 fuentes reales y ambas exportaciones, sin errores HTTP de assets de aplicación. SQL local conserva migraciones y validación de fases previas; no equivale a Auth/RLS/Storage/RPC alojados.

Archivos nuevos: manifests/helpers de imágenes y fuentes; scripts de generación/medición/reporte; accessibility.css; tests block-e/static-assets/images; 23 WebP y 12 WOFF2; evidencias y este informe. Modificados: consumidores DesignImage, EditorialCarousel, fuentes, Modal/ProgressBar, asociaciones de error y tabs, carga de Production/exportación, upload-catalog, MIME del servidor, empaquetado Vite y configuración Playwright/package lock. No se editaron sources/, modelos comerciales ni migraciones SQL.

Pendiente: revisión visual de contraste, Safari/iPad y teclado reales, screen readers, medición de campo y publicación controlada de variantes remotas. La verificación Supabase alojada continúa reservada para fase 24. Se detiene el trabajo al completar fase 19 para la segunda revisión.

