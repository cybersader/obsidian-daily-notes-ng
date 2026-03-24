/**
 * Deep merge two objects. Values from `source` override `target`.
 * Used to merge saved settings over defaults so new settings keys are preserved.
 */
export function deepMerge<T>(target: T, source: Partial<T> | null | undefined): T {
  if (!source) return target;

  const output = { ...target };
  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceVal = source[key];
    const targetVal = target[key];

    if (
      sourceVal !== null &&
      sourceVal !== undefined &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal) &&
      targetVal !== null
    ) {
      output[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
      ) as T[keyof T];
    } else if (sourceVal !== undefined) {
      output[key] = sourceVal as T[keyof T];
    }
  }
  return output;
}
