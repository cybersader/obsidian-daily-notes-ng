import { App, TFile } from 'obsidian';

const MAX_RESOLUTION_DEPTH = 10;

/**
 * Resolves group notes to their member person notes.
 * Group notes have `type: group` and a `members` list in frontmatter.
 * Supports nested groups with cycle detection.
 * Adapted from TaskNotes GroupRegistry pattern.
 */
export class GroupRegistry {
  constructor(private app: App) {}

  /**
   * Check if a file is a group note.
   */
  isGroupNote(file: TFile): boolean {
    const cache = this.app.metadataCache.getFileCache(file);
    return cache?.frontmatter?.type === 'group';
  }

  /**
   * Resolve a group note to its member person note paths.
   * Handles nested groups with cycle detection and depth limit.
   */
  resolveGroupToPersons(
    groupPath: string,
    visited: Set<string> = new Set(),
    depth: number = 0
  ): string[] {
    if (visited.has(groupPath)) return [];
    if (depth >= MAX_RESOLUTION_DEPTH) return [];

    visited.add(groupPath);

    const file = this.app.vault.getAbstractFileByPath(groupPath);
    if (!(file instanceof TFile)) return [];

    const cache = this.app.metadataCache.getFileCache(file);
    const members = cache?.frontmatter?.members;
    if (!Array.isArray(members)) return [];

    const resolved: string[] = [];
    for (const member of members) {
      const memberPath = this.resolveWikilink(member);
      if (!memberPath) continue;

      const memberFile = this.app.vault.getAbstractFileByPath(memberPath);
      if (!(memberFile instanceof TFile)) continue;

      if (this.isGroupNote(memberFile)) {
        resolved.push(...this.resolveGroupToPersons(memberPath, visited, depth + 1));
      } else {
        resolved.push(memberPath);
      }
    }

    return [...new Set(resolved)];
  }

  private resolveWikilink(link: string): string | null {
    // Extract path from [[link]] format
    const match = link.match(/\[\[([^\]|]+)/);
    if (!match) return null;

    const resolved = this.app.metadataCache.getFirstLinkpathDest(match[1], '');
    return resolved?.path ?? null;
  }
}
