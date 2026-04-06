import type { Lens } from './types.js'
import { resolve } from './_internal.js'

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
      <T extends S>(s: T) => ({ ...s, [key]: resolve(a, s[key]) }) as T,
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
