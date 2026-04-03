/**
 * Resolves a value-or-updater-function to a concrete value.
 * Used by Lens, Prism, and compose to normalize the `set(valueOrFn)` pattern.
 */
export const resolve = <A>(valueOrFn: A | ((a: A) => A), current: A): A =>
  typeof valueOrFn === 'function' ? (valueOrFn as (a: A) => A)(current) : valueOrFn
