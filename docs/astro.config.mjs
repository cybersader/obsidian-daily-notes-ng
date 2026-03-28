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
            // Starlight uses Expressive Code which wraps mermaid in:
            // <figure><pre data-language="mermaid"><code><div class="ec-line">...
            // Extract the raw text and replace with a .mermaid div
            document.querySelectorAll('pre[data-language="mermaid"]').forEach(pre => {
              const figure = pre.closest('figure');
              const target = figure || pre;
              // Extract text from all ec-line spans
              const lines = [];
              pre.querySelectorAll('.ec-line .code').forEach(line => {
                lines.push(line.textContent);
              });
              // Fallback: just get all text
              const text = lines.length > 0 ? lines.join('\\n') : pre.textContent;
              const div = document.createElement('div');
              div.classList.add('mermaid');
              div.textContent = text;
              target.replaceWith(div);
            });
            mermaid.initialize({ startOnLoad: false, theme: getTheme() });
            mermaid.run({ querySelector: '.mermaid' });
          }
          // Run after full page load (Expressive Code injects late)
          window.addEventListener('load', initMermaid);
          // Re-render on theme change
          new MutationObserver(() => {
            document.querySelectorAll('.mermaid[data-processed]').forEach(el => {
              el.removeAttribute('data-processed');
              el.innerHTML = el.dataset.original || el.textContent;
            });
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
