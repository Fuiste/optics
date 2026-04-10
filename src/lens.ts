import type { Lens } from './types.js'
import { resolve, setArraySlot } from './_internal.js'

export const makeLens = <S, A>(
  get: (s: S) => A,
  set: (a: A | ((a: A) => A)) => <T extends S>(s: T) => T,
): Lens<S, A> => ({
  _tag: 'lens',
  get,
  set,
})

const prop = <S, K extends keyof S>(key: K): Lens<S, S[K]> =>
  makeLens<S, S[K]>(
    (s) => s[key],
    (a) =>
      <T extends S>(s: T) => {
      const next = resolve(a, s[key])

      if (Object.is(next, s[key])) return s

      if (Array.isArray(s) && typeof key === 'number') {
        return setArraySlot(s, key, next) as T
      }

      return { ...s, [key]: next } as T
      },
  )

/**
 * Factory for creating lenses over a source type `S`.
 *
 * ```ts
 * const name = Lens<Person>().prop('name')
 * name.get(person)              // string
 * name.set('Alice')(person)     // Person
 * name.set(n => n.toUpperCase())(person)
 * ```
 */
export const createLens = <S>() => ({
  prop: <K extends keyof S>(key: K) => prop<S, K>(key),
})
