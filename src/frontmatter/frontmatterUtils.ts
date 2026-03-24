/**
 * Utilities for reading and writing YAML frontmatter in note content.
 */

const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---/;

/**
 * Extract frontmatter string from note content.
 */
export function extractFrontmatter(content: string): string | null {
  const match = content.match(FRONTMATTER_REGEX);
  return match ? match[1] : null;
}

/**
 * Check if a frontmatter key exists.
 */
export function hasFrontmatterKey(content: string, key: string): boolean {
  const fm = extractFrontmatter(content);
  if (!fm) return false;
  return new RegExp(`^${escapeRegex(key)}:`, 'm').test(fm);
}

/**
 * Set a frontmatter value. Creates frontmatter block if it doesn't exist.
 */
export function setFrontmatterValue(content: string, key: string, value: string): string {
  const fm = extractFrontmatter(content);

  if (!fm) {
    // No frontmatter - create it
    return `---\n${key}: ${value}\n---\n${content}`;
  }

  if (hasFrontmatterKey(content, key)) {
    // Update existing key
    const updated = fm.replace(
      new RegExp(`^(${escapeRegex(key)}:).*$`, 'm'),
      `$1 ${value}`
    );
    return content.replace(FRONTMATTER_REGEX, `---\n${updated}\n---`);
  }

  // Add new key
  return content.replace(FRONTMATTER_REGEX, `---\n${fm}\n${key}: ${value}\n---`);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
