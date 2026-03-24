/**
 * Parse markdown content to extract incomplete todo items.
 */
export interface TodoItem {
  text: string;
  indent: number;
  children: TodoItem[];
}

/**
 * Extract incomplete todos (unchecked checkboxes) from markdown content.
 */
export function extractIncompleteTodos(content: string, includeSubItems: boolean): TodoItem[] {
  // TODO: Parse markdown checkboxes
  // - [ ] Incomplete (extract)
  // - [x] Complete (skip)
  // Handle nested items if includeSubItems is true
  return [];
}

/**
 * Remove completed todos from content (for the "delete on complete" feature).
 */
export function removeCompletedTodos(content: string): string {
  // TODO: Remove lines matching - [x] pattern
  return content;
}

/**
 * Format todo items back to markdown.
 */
export function todosToMarkdown(todos: TodoItem[]): string {
  return todos.map(todo => {
    const indent = '  '.repeat(todo.indent);
    const line = `${indent}- [ ] ${todo.text}`;
    const children = todo.children.map(child => todosToMarkdown([child])).join('\n');
    return children ? `${line}\n${children}` : line;
  }).join('\n');
}
