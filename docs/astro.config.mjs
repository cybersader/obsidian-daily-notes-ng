import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
export default defineConfig({
  site: 'https://cybersader.github.io',
  base: '/obsidian-daily-notes-ng',
  integrations: [
    starlight({
      title: 'Daily Notes NG',
      description: 'Next-generation daily notes plugin for Obsidian',
      favicon: '/obsidian-daily-notes-ng/favicon.svg',
      head: [
        { tag: 'link', attrs: { rel: 'icon', href: '/obsidian-daily-notes-ng/favicon.svg', type: 'image/svg+xml' } },
        { tag: 'script', attrs: { type: 'module' }, content: `
          import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
          function getTheme() {
            return document.documentElement.dataset.theme === 'light' ? 'default' : 'dark';
          }
          function initMermaid() {
            // Convert Starlight code blocks to mermaid-compatible format
            document.querySelectorAll('code.language-mermaid').forEach(code => {
              const pre = code.parentElement;
              if (pre && pre.tagName === 'PRE') {
                pre.classList.add('mermaid');
                pre.textContent = code.textContent;
              }
            });
            mermaid.initialize({ startOnLoad: false, theme: getTheme() });
            mermaid.run({ querySelector: '.mermaid' });
          }
          // Run after DOM ready
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initMermaid);
          } else {
            initMermaid();
          }
          // Re-render on theme change
          new MutationObserver(() => {
            document.querySelectorAll('.mermaid svg').forEach(el => el.remove());
            document.querySelectorAll('.mermaid').forEach(el => el.removeAttribute('data-processed'));
            mermaid.initialize({ startOnLoad: false, theme: getTheme() });
            mermaid.run({ querySelector: '.mermaid' });
          }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        ` },
      ],
      logo: {
        dark: './src/assets/logo-dark.svg',
        light: './src/assets/logo-light.svg',
        alt: 'Daily Notes NG',
      },
      customCss: ['./src/styles/brand.css'],
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
