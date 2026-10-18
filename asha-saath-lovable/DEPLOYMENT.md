# Deploy the synthetic ASHA Saath demonstration

Prepared 9 October 2026. **Not deployed yet.** The user selected Render / Railway and then asked to finish UI/UX first. The built Node application has been exercised locally through the full referral journey. Docker/host deployment remains unverified.

## Runtime

Use Node 24. `npm run build:node` produces Nitro's node-server output without changing the default Lovable configuration. `npm start` launches the SQLite API, SSR process and a single public HTTP gateway. API and frontend share one origin; HTTPS is terminated by the hosting service. The public URL must be configured exactly so command origin checks and Secure cookies work.

| Variable | Value |
|---|---|
| `ASHA_DB_PATH` | Absolute file on persistent storage, e.g. `/var/data/asha-saath.sqlite` |
| `ASHA_PUBLIC_ORIGIN` | Exact public HTTPS origin, including scheme; no path |
| `PORT` | Set by the host; default 3000 |
| `NODE_ENV` | `production` |
| `ASHA_SSR_PORT` | Internal loopback port; default 4319 |

If `ASHA_PUBLIC_ORIGIN` is absent, startup accepts Render's `RENDER_EXTERNAL_URL` or Railway's `RAILWAY_PUBLIC_DOMAIN`. Custom domains require updating the explicit origin. Run one replica: the current SQLite design is not a shared multi-instance database. Do not place the SQLite file on ephemeral storage or upload the development database. A fresh host initializes fictional fixtures.

## Render

The app directory contains `Dockerfile` and `render.yaml`. Set the repository root to this app directory, or use a repository containing this directory's contents. The blueprint defines a **paid Starter web service and 1 GB persistent disk**. Review the current displayed price before creating resources; no spending authorization has been given in this session.

Connect the intended source repository, review the blueprint, mount `/var/data`, and confirm `ASHA_DB_PATH=/var/data/asha-saath.sqlite`. Health check is `/api/health`. Do not use a static-site deployment: it would omit the API/database. If the mounted directory is not writable by the container's `node` user, correct volume ownership through the host's supported mechanism before running. The container remains non-root.

## Railway

`railway.json` selects the Dockerfile, one replica and `/api/health`. Configure a persistent volume mounted at `/var/data` and the database variable above. Generate a public domain, then set `ASHA_PUBLIC_ORIGIN` to its HTTPS origin (or let `RAILWAY_PUBLIC_DOMAIN` supply it). Review the service/volume estimate before creating billable resources. Railway deployment has not been executed or independently verified.

## Local production smoke

After `npm ci` and `npm run build:node`, set the variables below using your shell, then run `npm start`:

```text
ASHA_PUBLIC_ORIGIN=http://127.0.0.1:5180
ASHA_DB_PATH=:memory:
ASHA_BIND_HOST=127.0.0.1
ASHA_SSR_PORT=4320
PORT=5180
```

`:memory:` is only for disposable verification. Use a persistent file for a demo that must survive restarts. Do not run two instances against the same SQLite file. Separate local ports share cookies for the same hostname, so signing in on one can invalidate the other app's session; sign in again after switching preview instances.

## After deployment

Verify `/api/health`, all three role workspaces, CSV preview, plan save, map attribution/tiles, exact HTTPS origin, secure HttpOnly session cookie, capacity transaction and permission withdrawal. Record one synthetic help request through confirmation/closure, restart the service, and check the data survives. No deployment is complete until the actual public URL and persistence are verified.

Open fictional accounts are intentional for the hackathon prototype. They are not production identity verification. Never enter real personal/health data. Live funding, national NGO coverage, offline sync, government APIs and Supabase RLS are not implemented.

Sources checked 9 October 2026: [Render disks](https://render.com/docs/disks), [Render Node guide](https://render.com/docs/deploy-node-express-app), [OpenStreetMap tile usage](https://operations.osmfoundation.org/policies/tiles/). Inspect current host configuration and pricing before deployment.
