# Delivered this week — 2026-10-05

Before: ALL loaded Delivered by creation date with paging; no actual delivery timestamp existed.
After: only ALL uses an owner-only weekly summary, counted in full and sorted by immutable delivery timestamp; six cards maximum, three columns desktop, existing two/one-column responsive behavior. View all delivered opens History filtered by delivered, without a weekly restriction. The zero lane stays visible and blank.

Week: Monday 00:00 inclusive through next Monday 00:00 exclusive, America/Guayaquil. Existing search and creation-date filters remain active. Customer order documents and History queries are unchanged. No rows deleted or historical data limited. Trigger captures actual transition atomically across existing status entrypoints; note edits cannot change delivery timestamp.

Migration 202610050002 applied to hosted Supabase successfully. Fresh-project bootstrap updated and verified.

Validation: typecheck/build PASS; 157 unit tests PASS; 84 existing PostgreSQL checks PASS; new PostgreSQL integration test PASS (boundary timestamps, delivery sorting independent of creation, total above six, history retention, notes immutability and owner authorization); seven relevant E2E tests PASS including desktop/tablet/mobile, zero lane, six-card composition, delivered-only History link, navigation, date filters, status changes and cancellation.

Historical limitation: older Delivered rows have no delivery timestamp. They remain in History and are excluded from the weekly summary; neither updated_at nor confirmed_at is used to invent delivery dates. No customer order statuses were changed for QA. Screenshots: artifacts/admin/delivered-week-six.png (nine-order isolated fixture, six visible), artifacts/admin/delivered-week-live.png (real authenticated panel, zero dated deliveries).
