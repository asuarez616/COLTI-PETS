# Local site startup routine

When asked to start or “levantar” the COLTI sites:

- Keep the Store and its local Admin bridge running together on `127.0.0.1:4176` and `127.0.0.1:4174`.
- Start the Store with Vite's `production` mode so it reads the existing `.env.production.local` Supabase configuration. Never print or expose secret values.
- Verify Supabase responds, the Store catalog loads, and the Admin sign-in form appears before reporting success.
- Open the Store at `/`. Routes under `/admin/` belong to the protected Admin application and require an authorized Supabase account.
- Keep server processes in persistent sessions. Do not change Supabase data or authentication settings just to start the sites.
