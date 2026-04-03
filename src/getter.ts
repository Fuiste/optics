import type { Getter } from './types.js'

/**
 * Constructs a read-only getter from a function.
 *
 * ```ts
 * const fullName = makeGetter<Person, string>(p => `${p.first} ${p.last}`)
 * fullName.get(person) // 'Alice Smith'
 * ```
 */
export const makeGetter = <S, A>(get: (s: S) => A): Getter<S, A> => ({
  _tag: 'getter',
  get,
})
