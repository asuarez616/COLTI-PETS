# COLTI — Fase 20.0: UI Corrections & Regression Pass
Fecha: 2026-10-02. Las fases 1–19 se mantienen como base aceptada. Solo se implementó 20.0; no staging, despliegue, integración Drive, polish general ni fases siguientes.

## Estado: corregido / verificado / pendiente
| Área | Corregido | Verificado | Pendiente |
|---|---|---|---|
| Catálogo | Altura proporcional, área cuadrada independiente | Woven/Printed en seis viewports | Revisión manual de aceptación |
| Idioma | Tabs localizados, labels nuevos EN/ES | Ambos idiomas en tabs; proyección ES | Revisión lingüística completa futura |
| Eyebrow | Pet name decorativo retirado | Ausencia y conservación de talla/ID tag | Ninguno funcional identificado |
| Lettering | Observador visible compartido y font en reverso | 36 fuentes decodifican; 01/09/33 en toda la cadena | Revisión visual manual final |
| Orden móvil | Imagen centrada y bloques de facts | Seis viewports, datos separados, thumbnails | Aprobación visual |
| Confirmación | Cabecera limpia, demo discreta, mismo resumen, acciones centradas | Demo, dos collares, descargas | Backend real, fuera del alcance |
| Regresión | Preservados motor, datos, assets y navegación | TypeScript, unit, SQL, E2E, build | Safari físico y screen readers |

## 1–3. Estado inicial, causa raíz y corrección de Step 3
DesignImage recibió width/height intrínsecos en fase 17. La regla CSS asignaba width:100% y aspect-ratio:1, pero no height:auto; el atributo height de 1254 px podía convertirse en altura renderizada. El resultado era un área rosa excesiva con imagen contenida en el fondo, aunque el test anterior solo comprobaba que cargara.

La corrección localizada mantiene height:auto y aspect-ratio:1 en la imagen y su botón; el grid alinea cards al inicio. No depende de altura del hero ni viewport. Se mantienen variantes WebP, srcset, sizes, lazy loading y resolución pequeña. Tests miden el rectángulo real, proporción y altura acotada en ambas colecciones y seis viewports.

## 4–5. Idioma y eyebrows
Tabs usan el traductor existente: WOVEN/PRINTED en inglés y TEJIDOS/ESTAMPADOS en español. Se mantienen tablist/tab/tabpanel, aria-selected, roving tabindex y Arrow/Home/End.

Se retira el pet name decorativo sobre tag-phone, tag-details, lettering, personalization y review. No hay elemento vacío reservado. Se conservan el contexto de talla YOUR SELECTED SIZE · M y FOR THE ID TAG. No se cambian preguntas, progress engine ni orden de steps.

## 6–8. Causa raíz, resolución común y Selected Font
FontSample observaba el span font-number con IntersectionObserver. Ese span estaba display:none en review, orden y área Selected del modal, por lo que nunca intersectaba y la fuente quedaba en Arial. Mostrar “Font 09” no comprobaba su aplicación real.

El nuevo hook useLettering observa un wrapper visible del preview. Usa el mismo loadFont/fontText, manifiesto de 36 fuentes y cache de fase 17. El cambio de selección actualiza la familia cuando se completa la carga, y muestra el estado de fallo si corresponde. Sigue siendo lazy: no carga las 36 al abrir el configurador.

El modal Selected usa ese renderer compartido; no se añadió un mapping por pantalla ni se reemplazó FittedLettering. Las pruebas comprueban computed font-family con colti-font-1/9/33 y document.fonts.check, no únicamente el texto del número.

## 9–10. Tag front/back y Review
TagPreview emplea el mismo hook de carga; ambos lados reciben la familia y peso seleccionados. Antes, las líneas del reverso eran spans sin familia aplicada. Se mantienen siluetas, safe areas, medición real de Engraving, mínimo legible/scroll interno y FittedLettering. No se realiza el polish estético de placas.

Review muestra la fuente real y elimina el eyebrow de mascota. Sus filas de datos permanecen separadas. No se reestructura la composición aprobada ni se mueve LETTERING. Nombres Pipo y Maximiliano Rodriguez y fuentes 01/09/33 se prueban explícitamente.

## 11–13. Your Order y datos estructurados
Desktop conserva producto horizontal y la segunda fila Tag + Lettering. La adaptación móvil usa:
- encabezado COLLAR N con Edit/Remove;
- imagen centrada de hasta 200 px y nombre asociado;
- COLLAR: Design, Size / width, Collar type;
- TAG: Style, Pet name, Phone y únicamente las categorías existentes;
- LETTERING & DESIGN: Font + preview compacto, decoración, thumbnails y verdaderas instrucciones.

Las facts son description lists dl/dt/dd, no una cuadrícula sin semántica. Las etiquetas desktop que no necesitan aparecer visualmente siguen disponibles al árbol accesible. Sus posiciones se contienen dentro de la lista para evitar scroll de documento por elementos visualmente ocultos.

getSummaryRows evoluciona la proyección común, sin proveedor/backend. Address, Health info, Family contact, Spayed/Neutered, Additional phones y Email mantienen sus propias filas. No se concatenan como Extra text. Datos antiguos sin estructura conservan su categoría Other.

Se eliminan de las instrucciones visibles solo las líneas técnicas regeneradas que coinciden exactamente con decoración/information icons/email ya representados; los datos guardados no cambian y las instrucciones libres anteriores se conservan. Se omite No personalization en orden/confirmación.

## 14. Confirmation desktop/mobile
Se eliminan el check amarillo, gran titular demo duplicado y aviso amarillo de confirmación. Cabecera: ORDER CONFIRMED, código, cliente, fecha y Local demo · not submitted, secundario y localizado. La condición order.demo conserva la distinción; no se afirma que una demo sea una orden real.

OrderDetail reutiliza OrderCollarSummary por collar, sin Edit/Remove tras guardar. Dos collares comparten proyección, filas y lettering. PDF/JPG están juntos y centrados; Start a new order debajo, secundario. En móvil permiten reflow sin overflow.

## 15. Production
Se mantiene su ItemCard y controles existentes; no adopta el nuevo layout de confirmación. Correcciones mínimas: lettering real con FontSample y extras como filas separadas, sin perder notas verdaderas ni attachments. Tests abren una orden demo con dos collares y comprueban la familia seleccionada en Production. Backend alojado no se desplegó ni verificó.

## 16. PDF / JPG
Las dos exportaciones mantienen su renderer común canvas; PDF sigue conteniendo páginas JPG, no texto editable/fuentes embebidas. loadFont aplica la fuente seleccionada al nombre antes de dibujarlo. El test instrumenta fillText y comprueba la familia realmente utilizada y la conservación del nombre, contacto familiar y dirección; luego descarga PDF/JPG.

Casos: Anti-fall sin personalización/Font 01, Hanging + Heart/Font 09, Hanging + Drawing/Font 33 y Anti-fall + Photo/Font 01. Cada fixture contiene dos collares diferentes y nombre largo; se verifican thumbnails de dibujo/foto. Las exportaciones omiten No personalization y muestran la decoración elegida. No se cambian reglas de compatibilidad.

Evidencias en artifacts/phase-20: none.pdf/jpg, decoration.pdf/jpg, drawing.pdf/jpg y dog_photo.pdf/jpg.

## 17. Localización
Nuevas claves en i18n: colecciones, COLLAR/PLACA, LETTERING & DESIGN/TIPOGRAFÍA Y DISEÑO, Style/Estilo, Order confirmed/Orden confirmada, indicador local y decoración. Los labels de facts reutilizan summaryLabels/extraLabels; Email utiliza el traductor. No se introducen etiquetas bilingües. El texto libre del cliente se conserva tal cual.

## 18. Accesibilidad
Se mantienen teclado, focus visible, trap/restauración de foco, Escape, tabs, accordions, progress, errores asociados y reduced-motion. Targets de navegación/acciones no se reducen. El flujo completo por teclado y las auditorías relevantes de fase 19 pasan.

Contraste pendiente, sin alterar colores aprobados: idioma 3.36:1, Production 4.21:1, headings pequeños de review 4.00:1 y LETTERING sobre rosa 3.73:1. Este último selector se documenta y se incluye explícitamente en los hallazgos conocidos de color-contrast; no se desactiva Axe globalmente. Los colores CSS de ese bloque no cambiaron. No se declara WCAG; Safari, VoiceOver/NVDA y teclado virtual real siguen pendientes.

## 19. Performance preservada
[Medición compilada de fase 20](../artifacts/block-e/performance-phase-20.json), misma metodología local de fase 17:
| Métrica | Fase 19 | Fase 20 |
|---|---:|---:|
| Inicial desktop | 2.040 MB / 10 solicitudes | 2.044 MB / 10 solicitudes |
| Inicial móvil | 447 KB / 7 solicitudes | 451 KB / 7 solicitudes |
| Fotos editoriales iniciales desktop / móvil | 2 / 0 | 2 / 0 |
| Fuentes de placa iniciales | 0 | 0 |
| JS principal | 265.38 KB | 267.81 KB |
| PDF separado | 435.64 KB | 435.64 KB |

La subida pequeña de JS corresponde a proyección/renderers/correcciones; no se afirma reducción. Variantes, originals excluidos de dist, carga diferida y exports dinámicos se mantienen. LCP/CLS son observaciones de laboratorio, no certificación ni medidas de campo.

## 20–21. Archivos y tests
Nuevos: src/catalog/useLettering.ts, src/SummaryFacts.tsx, src/AttachmentThumbnail.tsx, src/ui-corrections.css y tests/ui-corrections.spec.ts.

Modificados: components.tsx, OrderCollarSummary.tsx, CollarReview.tsx, ui/TagPreview.tsx, configurator/Configurator.tsx, domain/presentation.ts y su test, i18n/index.ts, exports/documents.ts, production/Production.tsx, main.tsx. Tests anteriores de tabs actualizados en configurator.spec.ts y block-e.spec.ts; su whitelist de contraste conserva los hallazgos medidos.

No se cambian imágenes originales, fuentes originales, iconos, crop del hero, datos comerciales, step engine, SQL, repositorios ni migraciones. No se editan sources/.

20 tests nuevos específicos: seis geometrías/idioma, tres cadenas de fuente, seis layouts de orden/confirmación, cuatro escenarios de exportación y uno de eyebrows/lazy fonts. Dos unitarias añadidas para rows y conservación de instrucciones.

## 22. Screenshots reproducibles
28 PNG en artifacts/phase-20, esperando fuentes reales, imágenes decodificadas y animaciones:
- [Step 3 desktop](../artifacts/phase-20/catalogue-1440.png) y [mobile](../artifacts/phase-20/catalogue-390.png).
- [Selected Font 09](../artifacts/phase-20/modal-font-09.png).
- [Review Font 33](../artifacts/phase-20/review-font-33.png).
- [Your Order desktop](../artifacts/phase-20/order-1440.png) y [mobile](../artifacts/phase-20/order-390.png).
- [Mobile Drawing](../artifacts/phase-20/mobile-drawing.png) y [Photo](../artifacts/phase-20/mobile-dog_photo.png).
- [Confirmation desktop](../artifacts/phase-20/confirmation-1440.png) y [mobile con dos collares](../artifacts/phase-20/confirmation-390.png).
- Variantes en 1366×768, 1194×834, 834×1194 y 320×740.

Desktop usa scroll independiente del panel: una captura del viewport muestra la cabecera y primera parte; la captura móvil larga permite inspeccionar ambos collares completos. La geometría del shell se comprueba aparte, no se expande para obtener una captura.

## 23. Resultados completos
| Validación | Resultado |
|---|---|
| TypeScript strict | PASS |
| Unitarias | 113 PASS |
| SQL local / migraciones / paridad | 54 PASS |
| E2E Chrome, incluyendo fases anteriores | 68 PASS |
| Vite build y assets estáticos | PASS |
| Responsive | Seis viewports, ambas colecciones y flujo completo |
| Hero / fluidez | Cuatro tests de estabilidad y pruebas de apertura/cierre/foco PASS |
| 36 fuentes | Decodificación y tarjetas reales PASS; 01/09/33 cadena transversal PASS |
| Accesibilidad | Flujo teclado, semántica, focus, Axe relevante PASS excepto contraste conocido documentado |
| Exports | Cuatro combinaciones de dos collares, PDF/JPG y familias canvas PASS |
| Recovery / drafts / edit / Back / uploads | Regresiones existentes PASS |

Comandos: TypeScript -b, Vitest run src, scripts/test-sql-local.mjs, Playwright test --timeout=30000 y Vite build. La medición utiliza scripts/measure-performance.mjs phase-20 sin sobrescribir las referencias before/after de fase 17.

## 24. Deuda y STOP
Pendiente de revisión visual/funcional manual: aceptación de esta fase, contrastes existentes, Safari/iPad físicos, teclado virtual y screen readers. Supabase alojado y verificación de producción real siguen fuera del alcance, como en fases aceptadas. TagPreview conserva el polish estético pendiente.

No se inicia testing definitivo siguiente, regresión visual definitiva, limpieza global CSS/tokens, Typeform polish, Drive ni staging. Trabajo detenido al finalizar 20.0.

