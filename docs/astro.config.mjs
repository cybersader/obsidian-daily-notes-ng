import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://cybersader.github.io',
  base: '/obsidian-daily-notes-ng',
  integrations: [
    starlight({
      title: 'Daily Notes NG',
      description: 'Next-generation daily notes plugin for Obsidian',
      logo: {
        src: './src/assets/logo.png',
        alt: 'Daily Notes NG',
      },
      social: {
        github: 'https://github.com/cybersader/obsidian-daily-notes-ng',
      },
      sidebar: [
        {
          label: 'Getting started',
          autogenerate: { directory: 'getting-started' },
        },
        {
          label: 'Features',
          autogenerate: { directory: 'features' },
        },
        {
          label: 'Concepts',
          autogenerate: { directory: 'concepts' },
        },
        {
          label: 'Guides',
          autogenerate: { directory: 'guides' },
        },
        {
          label: 'Development',
          autogenerate: { directory: 'development' },
        },
        {
          label: 'Reference',
          autogenerate: { directory: 'reference' },
        },
      ],
    }),
  ],
});
