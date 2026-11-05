import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Middlewares => [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    // Comma-separated list of allowed browser origins, e.g. CORS_ORIGINS=https://www.example.com,https://admin.example.com
    // Unset/empty = no cross-origin browser access (safe default). Strapi's own default is '*'.
    config: {
      origin: env.array('CORS_ORIGINS', []),
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
