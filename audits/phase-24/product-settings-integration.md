# Product Settings integration
Completed: 2026-10-06

## Changes
Main navigation: Orders, Catalog, Product Settings, Hero.
Product Settings contains Closures and ID Tags, using existing COLTI cards/dialogs/chips.
ID Tags: editable bilingual names, icons, state, order; existing Hanging models/sizes/dimensions; six Anti-fall models and editable master-valid mappings.
Anti-fall resolution adds no customer step. Micro cannot map to XS.
Published configuration flows through application/repository to PostgreSQL. Realtime plus existing 15-second reconciliation propagates to open Store. Manual sync is fallback with successful-read timestamps.
Unavailable selections persist, block Continue/review/confirm, and show an unavailable notice.

## Data and migration
202610070002_id_tags.sql applied successfully to fumscyebzupuqylslsdp.
id_tag_configuration: owner-edited JSON configuration with optimistic revision checks, public read-only access.
Master size_widths validates mappings; no second master combination table.
Existing tag_options maintains current Hanging compatibility.
Confirmation locks configuration, validates selections, and adds server-authored immutable tag_snapshot to newly confirmed items only.
Historical orders are never updated or re-resolved. Idempotent retries return the saved document.
Icon uploads reuse the existing authenticated alpha-preserving bounded image pipeline.

## Verification
Typecheck and production build pass.
176 source tests pass.
70 closure/ID Tags PostgreSQL assertions pass, including all 12 mappings, invalid combinations, owner authorization, rollback, inactive models/sizes, changed dimensions and immutable retries.
84 baseline SQL checks, 53 Admin SQL checks, catalog hierarchy checks and 3 icon/upload tests pass.
Live two-session browser: selected Plastic Buckle OFF blocked Continue; ON restored it without reload.
Live two-session browser: selected Anti-fall for M/2.5 disappeared and Continue disabled when Medium OFF; ON restored without reload.
Live two-session browser: selected Circle OFF invalidated selection; ON restored without reload.
All live test toggles restored to original active configuration.
Responsive viewport capability did not apply its requested size; mobile-specific visual verification remains unconfirmed. Temporary override reset.
No new real customer orders created.

## Scope
No Inventory, Stock, Materials, Costs, Prices, Payments, Shipping, CRM or Analytics added.
The existing local-server hosting dependency is unchanged.
