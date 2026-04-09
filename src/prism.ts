import type { Prism } from './types.js'

export const makePrism = <S, A>(prism: {
  get: (s: S) => A | undefined
  set: (a: A | ((a: A) => A)) => (s: S) => S
}): Prism<S, A> => ({
  _tag: 'prism',
  ...prism,
})

/**
 * Factory for creating prisms over a source type `S`.
 *
 * ```ts
 * const address = Prism<Person>().of({
 *   get: (p) => p.address,
 *   set: (a) => (p) => ({ ...p, address: a }),
 * })
 * ```
 */
export const createPrism = <S>() => ({
  of: <A>(prism: {
    get: (s: S) => A | undefined
    set: (a: A) => (s: S) => S
  }): Prism<S, A> =>
    makePrism<S, A>({
      get: prism.get,
      set: (a) => (s) => {
        const current = prism.get(s)

        if (typeof a === 'function') {
          if (current === undefined) return s
          const next = (a as (a: A) => A)(current)
          return Object.is(next, current) ? s : prism.set(next)(s)
        }

        if (current !== undefined && Object.is(a, current)) return s
        return prism.set(a)(s)
      },
    }),
})
