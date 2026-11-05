# Provelox images

Curated, production-ready Docker images for apps that have no official image, built and tested by [Provelox](https://github.com/floms/provelox) for use in Compose projects.

These are **unofficial** images. They are not published or endorsed by the upstream projects; each image's README says which project it packages.

## Images

| Image | Packages | Status |
| --- | --- | --- |
| [`images/strapi`](images/strapi) | [Strapi](https://strapi.io) 5 CMS (production runtime, plus a develop stage) | `ghcr.io/provelox/strapi` |

Images are published to GitHub Container Registry for `linux/amd64` and `linux/arm64`, only when a release tag is pushed (for example `strapi-v1.0.0`):

| Tag | Mode |
| --- | --- |
| `ghcr.io/provelox/strapi:1.0.0`, `:1.0`, `:1`, `:latest` | Production (`strapi start`) |
| `ghcr.io/provelox/strapi:1.0.0-dev`, `:1.0-dev`, `:1-dev`, `:latest-dev` | Development (`strapi develop`), for creating content types |

Pushes and pull requests build and smoke-test every image but publish nothing.

## Layout

Each app is one directory under `images/`, with its own `Dockerfile`, a README, and any sample Compose files. Shared conventions across images:

- Runs as a non-root user, with `tini` as PID 1 where the app needs signal handling.
- No secrets in the image; all configuration comes from environment variables.
- Health check in the image (`HEALTHCHECK`).
- No `VOLUME` instructions; deployments declare named volumes.
- Base images are tagged to a specific version line.

## Building locally

```bash
docker build -t strapi:local images/strapi
```

Each image's README has the run and Compose instructions. For Strapi, see [`images/strapi/DOCKER.md`](images/strapi/DOCKER.md).

## Contributing

Issues and pull requests are welcome. Keep changes to one image per pull request, and make sure the image still builds and passes its smoke test in CI.

## License

Apache License 2.0. See [LICENSE](LICENSE). Packaged upstream software keeps its own license.
