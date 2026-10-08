# Conectar Google Drive — COLTI Admin

Implemented: Connect / synchronize catalog or hero / disconnect. Uses read-only Drive OAuth, browser-bound single-use state, PKCE, refresh-token renewal, encrypted server storage and existing synchronization scripts. Tokens and client secrets never enter React or browser storage. Disconnect revokes Google authorization while preserving the catalog and historical order images.

## One-time Google setup

Create a Google Cloud project, enable Drive API and configure OAuth consent for COLTI. Create a **Web application** OAuth client. For local review register this exact redirect:

`http://127.0.0.1:4174/api/admin/drive/callback`

Use your Drive account as a test user while the consent application is in testing. It must have read access to all four catalog folders and the hero folder in `catalog-drive-sources.json`. The full Drive read-only scope is needed for the existing folders and their files; the narrower `drive.file` scope does not grant blanket access to pre-existing shared folders. Testing-mode refresh tokens can expire; the UI reports that reconnecting is necessary. Public deployment may require Google's verification for this scope.

Configure these server-only values in ignored `.env.admin-preview.local` (local review), or the hosting environment (production):

```
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_TOKEN_KEY=
```

The token key must be a random 32-byte key encoded as base64. Keep it backed up privately; changing it makes existing encrypted authorization unreadable. Do not use `VITE_` for any of these values. Never paste secrets into chat or commit them. Grant storage is `.asset-tools/private/drive-oauth.json`, ignored and AES-256-GCM encrypted.

Restart `npm run admin:preview`, open Catalog and click **Conectar Google Drive**. After Google consent, click **Sincronizar catálogo**. The sync button actually invokes the existing script with the authorized access token server-side; Reload only refreshes the saved catalog. Hero has its own synchronize action. The local preview is loopback only and intentionally demo; it is not production authorization.

## Production host

`npm run admin:server` provides the same endpoints and serves the built `dist` website. Install it alongside this project on a Node/Python server, with Pillow available and write access to generated catalog/hero assets. Place the loopback server behind an HTTPS reverse proxy that preserves Host and allows sync requests to finish. It cannot be deployed as a static-only site.

Required production environment: `COLTI_ADMIN_ORIGIN=https://your-domain`, `COLTI_ADMIN_PORT=3000`, `SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, plus the three OAuth settings. Configure `VITE_SUPABASE_URL` for the build as before. Register `<COLTI_ADMIN_ORIGIN>/api/admin/drive/callback` in Google. The server checks the existing non-anonymous Supabase user and `is_owner` before every private request; callbacks require the browser-bound OAuth state established by an authorized request. Credentials remain on the server. Catalog sync publishes through the existing `sync_drive_catalog` RPC; removed designs deactivate without deleting order snapshots. The service rebuilds the site after successful synchronization so the hero and local manifests update too.

Not configured/deployed in this session: real OAuth client, real Google consent, live Supabase and production hosting. Buttons show that setup is missing instead of simulating a connection. This implementation was tested with mocked OAuth responses, not a real account grant.

Reference: https://developers.google.com/identity/protocols/oauth2/web-server
