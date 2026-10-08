# Catalog organization — 2026-10-05

Woven: sections and quick group filters for M/ML/L/XL/2XL, S/SM, and 2XS/XS. Membership follows source compatibility and preserves unavailable designs. A design spanning groups appears in each compatible section. Bulk availability affects only the selected group plus current search/status/size/width filters. Empty woven groups retain their heading/count.

Printed: Drive folder collections, quick collection filters, per-card collection selector, new collection dialog, and return-to-Drive action. Owner-only revision-checked RPC stores manual assignment separately from source folder. Drive republishes source metadata without replacing manual assignments. Existing designs realtime channel delivers moves. Availability and historical orders are unchanged.

Migration 202610050004_catalog_collections.sql applied to hosted Supabase. Live E-1 moved from source collection to Cartoons, reload verified persisted move (27/18 counts), then restored with return-to-Drive (28/17 counts). Reset function applied and verified. No test orders or historical modifications.

Validation: 163 unit tests; 7 Admin/Drive E2E; final catalog E2E rerun; hierarchy and collection SQL checks; 53 Admin SQL checks; 5 Drive source tests; Drive SQL regression; TypeScript and production build. Existing responsive layout preserved. Screenshot: artifacts/admin/catalog-printed-collections.png.
