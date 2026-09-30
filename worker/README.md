# bscry-proxy Worker

Source of the Cloudflare Worker at `bscry-proxy.rhigman.workers.dev`. It is deployed from the Cloudflare dashboard, not from this repo, so treat this file as a copy: after changing the Worker, save the new source here too.

Routes:

| Route | Purpose |
|---|---|
| `?url=<image>` | fetch an image with CORS headers so the site can read its pixels |
| `?token=<image>` | get an OTFBM token shortcode |
| `POST ?host` | upload a map or token to R2 under `u/` (Discord login required) |
| `POST ?enhance` | AI-upscale an image with Cloudflare Images (`upscale: "generate"`), store the result under `u/` (login required, 25 per user per day) |
| `POST ?upload` | legacy imgbb upload |
| `/auth/login`, `/auth/callback`, `/auth/me` | Discord OAuth and session check |

Bindings (set in the dashboard, not in code): `BSCRY_KV`, `MAPS_BUCKET`, and the secrets `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `SESSION_SECRET`.

`IMGBB_KEY` is redacted in this copy. Do not paste this file over the live Worker without putting the real key back, or the legacy `?upload` route will stop working.
