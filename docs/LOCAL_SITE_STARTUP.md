# Local site startup routine

On Windows, run `Start-COLTI.cmd` from the project root. It installs the required Node.js LTS/pnpm versions when missing, runs `pnpm install --frozen-lockfile`, then starts only the local services that are not already responding. It opens the Store and local Admin preview and keeps logs/PIDs under `.colti-runtime/`. Run `Stop-COLTI.cmd` to stop only the processes started by this launcher. Local environment files are never printed, copied to Git, or changed.

When asked to start or “levantar” the COLTI sites:

- Keep the Store and its local Admin bridge running together on `127.0.0.1:4176` and `127.0.0.1:4174`.
- Start the Store with Vite's `production` mode so it reads the existing `.env.production.local` Supabase configuration. Never print or expose secret values.
- Verify Supabase responds, the Store catalog loads, and the Admin sign-in form appears before reporting success.
- Open the Store at `/`. Routes under `/admin/` belong to the protected Admin application and require an authorized Supabase account.
- Keep server processes in persistent sessions. Do not change Supabase data or authentication settings just to start the sites.
