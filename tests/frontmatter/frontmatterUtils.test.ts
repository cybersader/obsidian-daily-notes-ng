import {
  extractFrontmatter,
  hasFrontmatterKey,
  setFrontmatterValue,
} from '../../src/frontmatter/frontmatterUtils';

describe('frontmatterUtils', () => {
  const sampleContent = `---
title: Test Note
date created: 2026-01-01
---

Some content here.`;

  test('extractFrontmatter returns frontmatter string', () => {
    const fm = extractFrontmatter(sampleContent);
    expect(fm).toContain('title: Test Note');
    expect(fm).toContain('date created: 2026-01-01');
  });

  test('extractFrontmatter returns null for no frontmatter', () => {
    expect(extractFrontmatter('Just some text')).toBeNull();
  });

  test('hasFrontmatterKey detects existing keys', () => {
    expect(hasFrontmatterKey(sampleContent, 'title')).toBe(true);
    expect(hasFrontmatterKey(sampleContent, 'date created')).toBe(true);
  });

  test('hasFrontmatterKey returns false for missing keys', () => {
    expect(hasFrontmatterKey(sampleContent, 'nonexistent')).toBe(false);
  });

  test('setFrontmatterValue updates existing key', () => {
    const result = setFrontmatterValue(sampleContent, 'title', 'Updated Title');
    expect(result).toContain('title: Updated Title');
    expect(result).toContain('Some content here.');
  });

  test('setFrontmatterValue adds new key', () => {
    const result = setFrontmatterValue(sampleContent, 'tags', '[test]');
    expect(result).toContain('tags: [test]');
    expect(result).toContain('title: Test Note');
  });

  test('setFrontmatterValue creates frontmatter if missing', () => {
    const result = setFrontmatterValue('Just text', 'title', 'New');
    expect(result).toMatch(/^---\ntitle: New\n---\nJust text$/);
  });
});
