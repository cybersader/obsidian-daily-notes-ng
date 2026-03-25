#!/usr/bin/env bun
/**
 * Version bump script for Daily Notes NG.
 * Bumps version in package.json, manifest.json, versions.json,
 * adds a CHANGELOG.md placeholder, stages files, and commits.
 *
 * Usage:
 *   bun run scripts/release/bump-version.ts --type patch
 *   bun run scripts/release/bump-version.ts --type minor
 *   bun run scripts/release/bump-version.ts --type major
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

// Parse args
const typeArg = process.argv.find((a, i) => process.argv[i - 1] === '--type');
if (!typeArg || !['patch', 'minor', 'major'].includes(typeArg)) {
  console.error('Usage: bun run scripts/release/bump-version.ts --type <patch|minor|major>');
  process.exit(1);
}

const bumpType = typeArg as 'patch' | 'minor' | 'major';

// Read current version
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const currentVersion: string = pkg.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Calculate new version
let newVersion: string;
switch (bumpType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

console.log(`Bumping ${bumpType}: ${currentVersion} → ${newVersion}`);

// Update package.json
pkg.version = newVersion;
writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('  ✓ package.json');

// Update manifest.json
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
manifest.version = newVersion;
writeFileSync('manifest.json', JSON.stringify(manifest, null, '\t') + '\n');
console.log('  ✓ manifest.json');

// Update versions.json
const versions = JSON.parse(readFileSync('versions.json', 'utf8'));
versions[newVersion] = manifest.minAppVersion;
writeFileSync('versions.json', JSON.stringify(versions, null, '\t') + '\n');
console.log('  ✓ versions.json');

// Add CHANGELOG.md placeholder if entry doesn't exist
const changelogPath = 'CHANGELOG.md';
if (existsSync(changelogPath)) {
  const changelog = readFileSync(changelogPath, 'utf8');
  if (!changelog.includes(`## [${newVersion}]`)) {
    const today = new Date().toISOString().split('T')[0];
    const placeholder = `## [${newVersion}] - ${today}\n\n### Added\n- \n\n### Fixed\n- \n\n`;
    // Insert after the "# Changelog" header
    const updated = changelog.replace(
      /^(# Changelog\n+)/,
      `$1${placeholder}`
    );
    writeFileSync(changelogPath, updated);
    console.log('  ✓ CHANGELOG.md (placeholder added)');
  } else {
    console.log('  ✓ CHANGELOG.md (entry already exists)');
  }
} else {
  console.log('  ⚠ CHANGELOG.md not found, skipping');
}

// Stage and commit
try {
  execSync('git add package.json manifest.json versions.json CHANGELOG.md', { stdio: 'inherit' });
  execSync(`git commit -m "release: v${newVersion}"`, { stdio: 'inherit' });
  console.log(`\n✅ Released v${newVersion}. Push to main to trigger CI release.`);
} catch (e) {
  console.error('\n⚠ Git commit failed. Files are staged — commit manually.');
}
