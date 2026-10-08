# Closures and admin visual corrections

Implemented and applied to the configured COLTI Supabase project:

- Catalog size/width chips use selected colors, without checkmarks/minus signs. Centered dialog sizes to its content.
- Catalog upload is the primary action. Drive is a separate, collapsed manual-import section in Catalog and Hero.
- Hero publish bar has compact context/status and a neutral disabled Save action.
- Product Settings → Closures configures existing keys, EN/ES names, immutable icon uploads, active state, order and master Size/Width preferences.
- Existing names/icons seed the configuration. Public closures read backend configuration and reconcile through the existing realtime transport and fallback reads.
- Closure size OFF and active OFF preserve width preferences. Single-width sizes are implicit. Invalid combinations fail in Domain and owner RPC validation.
- Closure validation participates in fastening, review and confirmation. Invalidated selections are preserved and require another valid choice.
- Confirmation locks closure configuration and validates on the server. Only newly created order snapshots capture closure names/icon; historical records and idempotent retries are untouched.
- No ID Tags work was started.

Verification:

- Entire source suite: 171 tests passed before the additional closure notification test; subsequent focused suite: 10 passed.
- Closures PostgreSQL suite: 34 checks passed (including permissions, conflict, metadata, preferences, unavailable confirmation, history and idempotent retry).
- Existing PostgreSQL suite: 84 checks passed.
- Upload/Drive endpoint suites: 9 passed, including alpha-preserving closure icon processing.
- Typecheck and production build passed.
- Hosted migration execution succeeded in Supabase.
- Live UI: disabled Plastic Buckle XS/1.5; open Store removed the option and disabled Continue without reload. Restored the original availability immediately and observed the option return.
- Live manual closure refetch succeeded with timestamp update.
- 390px mobile check: dialog remains within viewport, no page horizontal overflow. Browser viewport reset after inspection.

Screenshots are in `artifacts/admin/`: catalog-toolbar-final.png, catalog-modal-final.png, hero-toolbar-final.png, closures-final.png, closures-mobile.png.

Runtime: loopback review server on port 4176. These changes do not publish a permanent hosted server.
