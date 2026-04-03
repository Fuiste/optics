import type { Traversal } from './types.js'

/**
 * Constructs a traversal from explicit `getAll` and `modify` functions.
 *
 * ```ts
 * const evens = makeTraversal<number[], number>({
 *   getAll: (ns) => ns.filter(n => n % 2 === 0),
 *   modify: (f) => (ns) => ns.map(n => n % 2 === 0 ? f(n) : n),
 * })
 * ```
 */
export const makeTraversal = <S, A>(traversal: {
  getAll: (s: S) => ReadonlyArray<A>
  modify: (f: (a: A) => A) => <T extends S>(s: T) => T
}): Traversal<S, A> => ({
  _tag: 'traversal',
  ...traversal,
})
