# Phase 24 synchronization checkpoint

## Real backend completed
- Project `colti-pets` (`fumscyebzupuqylslsdp`): real migrated schema, 264 Drive designs, 36 fonts.
- User-created account was verified. Administrator permission was granted after explicit user approval. No password was read or saved by the agent.
- Anonymous sign-in enabled after explicit approval. Customer isolation remains enforced by database privileges and RLS.
- Live build served at http://127.0.0.1:4176; protected administrator at /admin/orders.
- Real test order `COLTI-US-0001` / `COLTI SYNC TEST`: concurrent confirmation, recovery and repeated confirmation resolve to the same order. Customer cannot call admin_orders or acquire owner permission.
- Real public Supabase Realtime subscription reaches SUBSCRIBED. This proves connectivity only, not mutation propagation.
- Typecheck, 147 unit tests and production build pass. Public CSS artifact hash remains `index-D70kjJbt.css`.

## P0 gate remains incomplete
- User successfully signed into the live administrator after password recovery.
- Real order COLTI-US-0001 is visible through Admin and survives refresh. Its test-only status was advanced through In progress, Ready and Delivered.
- A second open board received Ready without F5. User-created COLTI-US-0002 (Toya) appeared automatically in that open board and remained after reload; its status was not changed by the agent.
- Variant CH-1 / 2.5 cm was temporarily disabled through Admin: real anonymous REST read confirmed enabled=false, revision=1. Restored enabled=true, revision=2. Whole-design state stayed active.
- Hero image 0.png was disabled/saved: an already-open public carousel changed from 8 to 7 images without reload. Restored/saved and observed 8 images again. Source order preserved.
- Evidence: live-orders-persisted.png and live-hero-restored.png.
- Verify actual cross-session order/status, whole/variant availability and hero changes; missed-event reconciliation and reconnect.
- Check selected-unavailable design remains selected and confirmation is blocked.
- Do not advance to P1/P2/P3 until P0 passes.

## Drive remaining work (P1)
Current middleware runs the sync script manually and rebuilds the site. Hero source is bundled JSON. This does not satisfy automatic additions/deletions within 60 seconds without build/reload. Google OAuth remains unconfigured. Need server synchronization plus dynamic source delivery, last-good retention, historical snapshots, preserved owner visibility/order and new hero images inactive. No automatic synchronization completion is claimed.

## Evidence
- `live-order-proof.json` (non-secret identifiers/checks only).
- `supabase-client-access.png` (enabled anonymous setting).
- `supabase-created-user.png` (user-created account).

Existing demo orders were neither migrated nor deleted. Only one clearly marked live test order was added. No unrelated UX, layout or business-rule changes were made in this checkpoint.
