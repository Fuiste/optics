import type { Prism } from './types.js'

export const makePrism = <S, A>(prism: {
  get: (s: S) => A | undefined
  set: (a: A | ((a: A) => A)) => <T extends S>(s: T) => T
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
      set:
        (a) =>
        <T extends S>(s: T) => {
          if (typeof a === 'function') {
            const current = prism.get(s)
            if (current === undefined) return s
            const next = (a as (a: A) => A)(current)
            return (prism.set as (a: A) => (s: S) => S)(next)(s) as T
          }
          return (prism.set as (a: A) => (s: S) => S)(a)(s) as T
        },
    }),
})
