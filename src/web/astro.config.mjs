// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

import expressiveCode from 'astro-expressive-code';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  site: 'https://beta.cmt.nkko.link',

  adapter: cloudflare({
    platformProxy: {
      enabled: true
    },

    imageService: "cloudflare"
  }),

  vite: {
    css: {
      transformer: 'lightningcss',
    }
  },

  integrations: [expressiveCode({
    themes: ['catppuccin-macchiato']
  }), svelte()]
});