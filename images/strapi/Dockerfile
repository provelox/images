# syntax=docker/dockerfile:1

# ---------- Build stage: install deps and build the Strapi admin + server ----------
ARG NODE_VERSION=24-bookworm-slim

FROM node:${NODE_VERSION} AS build

# better-sqlite3 falls back to compiling from source if no prebuilt binary matches
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build \
  && npm prune --omit=dev

# ---------- Dev stage: full dependencies + `strapi develop` (Content-Type Builder enabled) ----------
# Build with: docker build --target dev -t strapi:dev .  (docker-compose.dev.yml does this for you)
FROM node:${NODE_VERSION} AS dev

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/app
ENV NODE_ENV=development HOST=0.0.0.0 PORT=1337

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN chown -R node:node /opt/app

USER node
EXPOSE 1337 8000

CMD ["npm", "run", "develop"]

# ---------- Runtime stage: only what is needed to run ----------
FROM node:${NODE_VERSION} AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends tini \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=1337 \
    DATABASE_CLIENT=sqlite \
    DATABASE_FILENAME=data/data.db

WORKDIR /opt/app

# Pruned node_modules + compiled output (dist/, build/) + app files; .env/.tmp are excluded by .dockerignore
COPY --from=build --chown=node:node /opt/app ./

# SQLite database directory and uploads dir; mount volumes here to persist data.
# No VOLUME instruction: anonymous volumes are lost on removal, so volumes are declared by the deployment instead.
RUN mkdir -p /opt/app/data /opt/app/public/uploads \
  && chown -R node:node /opt/app/data /opt/app/public/uploads

USER node
EXPOSE 1337

# Required at runtime (do NOT bake into the image):
#   APP_KEYS, API_TOKEN_SALT, ADMIN_JWT_SECRET, TRANSFER_TOKEN_SALT, JWT_SECRET, ENCRYPTION_KEY
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||1337)+'/_health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# tini forwards SIGTERM to Node and reaps zombie processes; run Strapi directly (not via npm) so signals reach it
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "node_modules/@strapi/strapi/bin/strapi.js", "start"]
