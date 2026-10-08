# Catalog availability hierarchy — 2026-10-05

Implemented and activated: Whole design → Size → compatible Width. Master size/width and source compatibility intersect. Independent retained settings; explicit size-width overrides inherit legacy width preferences where absent. Additive table catalog_size_availability has owner-only revision-checked RPC writes and public read-only RLS. Confirmation validates hierarchical availability with existing design locking and idempotent recovery. Historical order snapshots remain unchanged. Catalog realtime includes the new table.

Visual: shared compact Drive disclosure/chip for Catalog; product image 88px beside code/type; three columns desktop, two tablet, one mobile. Real size switches and compact width controls; no passive size list or redundant Active/Inactive text. Existing filters retained.

Validation: Typecheck; 161 unit tests; 7 Admin/Drive E2E; 53 existing Admin SQL checks; 84 full SQL checks; dedicated hierarchy PostgreSQL checks; demo local persistence; production build. Responsive screenshots desktop/tablet/mobile without horizontal overflow.

Production: user explicitly authorized migration, applied successfully to hosted Supabase on 2026-10-05. Fresh production dist installed on port 4176. Actual authenticated Admin size M / CH-1 toggled OFF then restored ON. Separate public Supabase client received both realtime events and independently confirmed persisted state. Test settings restored; no orders created, updated or deleted. Screenshot artifacts/admin/catalog-hierarchy-live-refined.png captures actual catalog.

Migration: supabase/migrations/202610050003_catalog_size_availability.sql. Source-unavailable designs remain unavailable regardless of admin switches.
