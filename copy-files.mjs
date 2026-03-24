/**
 * Copy built plugin files to test vault and optional additional paths.
 * Usage: node copy-files.mjs
 *
 * Copies main.js, styles.css, manifest.json to:
 *   1. test-vault/.obsidian/plugins/daily-notes-ng/ (always)
 *   2. Any paths listed in .copy-files.local (one per line, optional)
 *   3. Path in OBSIDIAN_PLUGIN_PATH env var (optional)
 */
import { copyFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';

const FILES = ['main.js', 'styles.css', 'manifest.json'];
const DEFAULT_DEST = 'test-vault/.obsidian/plugins/daily-notes-ng';

function expandHome(p) {
  return p.startsWith('~') ? join(homedir(), p.slice(1)) : p;
}

function copyTo(dest) {
  dest = expandHome(dest);
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  for (const file of FILES) {
    if (existsSync(file)) {
      copyFileSync(file, join(dest, file));
      console.log(`  ${file} -> ${dest}`);
    }
  }
}

// Always copy to test vault
console.log('Copying to test vault...');
copyTo(DEFAULT_DEST);

// Copy to env var path
if (process.env.OBSIDIAN_PLUGIN_PATH) {
  console.log(`Copying to OBSIDIAN_PLUGIN_PATH...`);
  copyTo(process.env.OBSIDIAN_PLUGIN_PATH);
}

// Copy to paths in .copy-files.local
const localFile = '.copy-files.local';
if (existsSync(localFile)) {
  const paths = readFileSync(localFile, 'utf-8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));

  for (const p of paths) {
    console.log(`Copying to ${p}...`);
    copyTo(p);
  }
}

console.log('Done.');
