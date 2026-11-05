# Strapi image (unofficial)

Production-ready Docker image for [Strapi](https://strapi.io) 5, packaged by Provelox. Strapi does not publish an official image, so this one is built and smoke-tested here.

- Production runtime (default target): `strapi start`, Content-Type Builder locked.
- Develop target (`--target dev`): `strapi develop` for designing content types.
- Postgres, MySQL, or SQLite, selected by environment variables.

Full instructions, environment variables, Compose files, and the Provelox deployment are in [DOCKER.md](DOCKER.md).

```bash
docker build -t strapi:local .
```

This directory is a complete Strapi project. Content types and code are included as the starting point; change `src/` and `config/` for your own application.
