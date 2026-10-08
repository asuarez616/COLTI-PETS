# Catalog browse/edit separation — 2026-10-05

Catalog now shows product photo/code and a Configure affordance. Availability, size/width controls and printed collection moves appear only inside an accessible native dialog styled as a right-hand editor. Native modal focus containment, close button and Escape supported. Selection is by stable design ID; editor reads current realtime data. Cards do not expand the grid. No backend or historical-order changes.

Single filter surface contains family selection, compact Drive disclosure/status, search, size, width and availability filter. Group navigation and original compatibility grouping retained. Bulk actions move to a disclosure and preserve existing confirmation/revision logic. Removed marketing eyebrow and redundant explanatory text. Four columns desktop, three intermediate, two tablet/mobile; editor fits viewport and scrolls internally.

Validation: TypeScript and production build. Seven Admin/Drive E2E passed. After final toolbar refinement, catalog persistence/new collection/hidden controls/Escape, responsive Admin and Drive controls tests rerun: three passed. Actual hosted catalog verified visually with editor open/closed, without modifying availability. Saved screenshots artifacts/admin/catalog-browse-redesign.png and catalog-editor-redesign.png. Public CSS unchanged.
