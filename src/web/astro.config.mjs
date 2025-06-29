// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  site: 'https://beta.cmt.nkko.link',
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    },

    imageService: "cloudflare"
  })
});