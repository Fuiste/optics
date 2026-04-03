import type { Fold } from './types.js'

/**
 * Constructs a read-only fold from a function that extracts multiple values.
 *
 * ```ts
 * const words = makeFold<string, string>(s => s.split(' '))
 * words.getAll('hello world') // ['hello', 'world']
 * ```
 */
export const makeFold = <S, A>(getAll: (s: S) => ReadonlyArray<A>): Fold<S, A> => ({
  _tag: 'fold',
  getAll,
})
