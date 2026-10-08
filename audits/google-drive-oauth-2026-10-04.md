# Google Drive OAuth implementation

Before: Admin Reload loaded a saved catalog; no website OAuth consent or browser-triggered synchronization existed. A connected chat plugin could only update files during a chat session.

After: Catalog and Hero share a scoped Drive connection panel. React calls application operations and an HTTP repository; Google OAuth, refresh tokens, encrypted persistence and script execution remain server-only. The Vite admin-preview mounts the API solely on loopback. A separate production Node host provides the same API guarded by existing Supabase non-anonymous owner authorization and serves built assets. Tokens never appear in status responses, URLs returned to React, localStorage or bundled assets. Requests require same-origin JSON POST; callbacks require expiring single-use browser-bound state and PKCE. Synchronization is serialized and failed runs do not receive a last-sync timestamp. Disconnect revokes Google authorization and preserves existing images/orders.

Validation: typecheck and build passed; 144 unit tests passed; 6 OAuth server tests passed; 6 Admin/Drive browser tests passed. Browser tests use mocked Google authorization/API responses. Actual local review API reports configured=false/connected=false and the button is disabled with a setup message. Public configurator CSS remains index-D70kjJbt.css.

Pending external setup: Google OAuth client ID/secret, server encryption key, registered callback URL and real consent; production Supabase credentials/migrations and hosting deployment. No secrets or connection were fabricated. No real-account end-to-end synchronization was run.

Separate issue reported during this work: the 4174 preview uses seeded demonstration orders and is not connected to orders saved by the 4173 configurator. This change does not solve or claim to solve that order-data connection. Port-specific browser storage cannot be treated as production persistence.
