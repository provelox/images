# Running Strapi with Docker

This project ships one `Dockerfile` with three stages and two Compose files:

| Stage / file | What it produces | Mode |
| --- | --- | --- |
| `runtime` (default) | `strapi:local` — production image, ~1.4 GB | `strapi start`, `NODE_ENV=production` |
| `dev` (`--target dev`) | `strapi:dev` — full dependencies, ~3.3 GB | `strapi develop`, Content-Type Builder enabled |
| `docker-compose.yml` | Strapi + PostgreSQL 16 (production) | uses `runtime` |
| `docker-compose.dev.yml` | override for the above | uses `dev`, mounts `src/`, `config/`, `database/`, `public/` |
| `deploy/provelox/docker-compose.yml` | Provelox deployment (Strapi + Postgres, public via proxy) | uses the published `runtime` image |

Content types are designed in **develop** mode and shipped in **production** mode. The production image cannot edit content types, by design.

## Prerequisites

- Docker with Compose v2
- A `.env` file in this directory (gitignored) with the variables below

## Environment variables

Required (no defaults; Compose fails fast if missing):

| Variable | Purpose |
| --- | --- |
| `APP_KEYS` | Comma-separated session keys |
| `API_TOKEN_SALT` | API token salt |
| `ADMIN_JWT_SECRET` | Admin JWT secret |
| `TRANSFER_TOKEN_SALT` | Data-transfer token salt |
| `JWT_SECRET` | Users & Permissions JWT secret |
| `ENCRYPTION_KEY` | Encryption key for stored secrets |
| `POSTGRES_PASSWORD` | Password for the Postgres `strapi` user (Compose only) |

Generate secrets with `openssl rand -base64 16` (use a new value for each).

Optional:

| Variable | Default | Purpose |
| --- | --- | --- |
| `CORS_ORIGINS` | *(empty — no cross-origin browser access)* | Comma-separated browser origins allowed to call the API, e.g. `https://www.example.com,https://admin.example.com` |
| `HOST` | `0.0.0.0` | Bind address |
| `PORT` | `1337` | HTTP port |

Database settings for the image are read at runtime: `DATABASE_CLIENT` (`postgres`, `mysql` or `sqlite`), `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_SSL`. The image defaults to SQLite; Compose sets Postgres.

## Production

Build and run with Postgres:

```bash
docker compose up --build -d
docker compose logs -f strapi
```

- Health: http://localhost:1337/_health (returns 204)
- Admin: http://localhost:1337/admin (content-type editing is disabled here, as intended)

Stop without deleting data: `docker compose down`. Delete the database and uploads too: `docker compose down -v`.

Build only the production image:

```bash
docker build -t strapi:local .
```

## Development (content-type editing)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Open http://localhost:1337/admin. Changes made in the Content-Type Builder are written to `src/api/` and `src/components/` on your machine through the volume mounts, so commit them.

Build only the dev image:

```bash
docker build --target dev -t strapi:dev .
```

Typical workflow:

1. Design content types in the dev stack.
2. Commit the generated files under `src/`.
3. Run `docker compose up --build` to verify the production image picks them up.

Edits made inside a running production container are lost on restart. Don't design content types there.

## Deploying with Provelox

Provelox takes a Compose file, but it does not build images, and a host `ports:` entry publishes directly on the server, bypassing the platform's proxy. `deploy/provelox/docker-compose.yml` is written to its rules: it references a published image, uses named volumes, and marks Strapi as public with `x-provelox: expose` so traffic goes through the proxy and HTTPS.

1. Build and publish the production image (the publish script is not written yet):
   ```bash
   docker build -t <namespace>/strapi:<version> .
   docker push <namespace>/strapi:<version>
   ```
2. In Provelox, choose **New → Compose project** and paste `deploy/provelox/docker-compose.yml`.
3. Fill in `STRAPI_IMAGE` (for example `<namespace>/strapi:<version>`). Secrets are generated for you, so leave them as generated. `CORS_ORIGINS` is optional.
4. Review the plan, then deploy.
5. Open the `strapi` service's **Networking** tab and attach your domain. HTTPS is set up there.

To update, paste the file again with a new `STRAPI_IMAGE` tag. Keep the secrets unchanged, especially `ENCRYPTION_KEY` and `POSTGRES_PASSWORD`, or stored data becomes unreadable or the database stops accepting connections.

The plan is checked against the Provelox rules before deploy. I ran the same checks against this file locally: no errors and no warnings. A file with `build:` is rejected.

## Upload and database volumes

| Volume | Holds |
| --- | --- |
| `postgres-data` | Postgres data directory |
| `uploads` | Media uploads (`/opt/app/public/uploads`) |

Both survive `docker compose down` and are removed by `docker compose down -v`.

## Notes and open items

- **Secrets** are passed as environment variables. These are visible to anyone who can run `docker inspect`. For a cloud host, use that platform's secret store instead of `.env`.
- **Uploads** use the local provider. They won't be shared between multiple instances. Move to an object-storage provider (e.g. S3) before scaling out.
- **Base images are not pinned** to exact versions (`node:24-bookworm-slim`, `postgres:16`). Pin them before publishing release images.
- **The image declares no `VOLUME`s.** Volumes are declared by the deployment (Compose or Provelox) so they are named and survive container removal.
- **Behind a reverse proxy**, set Strapi's public URL and proxy settings so admin links and cookies work.
- **Postgres backups** are not configured. Back up the `postgres-data` volume or use `pg_dump`.
