/**
 * Resolves a value-or-updater-function to a concrete value.
 * Used by Lens, Prism, and compose to normalize the `set(valueOrFn)` pattern.
 */
export const resolve = <A>(valueOrFn: A | ((a: A) => A), current: A): A =>
  typeof valueOrFn === 'function' ? (valueOrFn as (a: A) => A)(current) : valueOrFn

export const hasIndex = (items: ReadonlyArray<unknown>, index: number): boolean =>
  Number.isInteger(index) && index >= 0 && index < items.length

export const setArraySlot = <A>(
  items: ReadonlyArray<A>,
  index: number,
  value: A,
): ReadonlyArray<A> => {
  if (Object.is(items[index], value)) return items
  const next = items.slice()
  next[index] = value
  return next
}

export const mapArrayWithIdentity = <A>(
  items: ReadonlyArray<A>,
  map: (value: A, index: number) => A,
): ReadonlyArray<A> => {
  let next: A[] | undefined

  for (let index = 0; index < items.length; index += 1) {
    const current = items[index]!
    const mapped = map(current, index)

    if (next !== undefined) {
      next.push(mapped)
      continue
    }

    if (!Object.is(mapped, current)) {
      next = items.slice(0, index) as A[]
      next.push(mapped)
    }
  }

  return next === undefined ? items : next
}
