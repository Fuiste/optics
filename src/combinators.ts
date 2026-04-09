import type { Prism, Traversal } from './types.js'
import { hasIndex, mapArrayWithIdentity, setArraySlot } from './_internal.js'
import { makePrism } from './prism.js'
import { makeTraversal } from './traversal.js'

/**
 * Creates a prism from a type-guard predicate.
 * Much more ergonomic than manually writing `Prism().of(...)` for discriminated unions.
 *
 * ```ts
 * type Shape = Circle | Square
 * const circle = guard<Shape, Circle>((s): s is Circle => s.type === 'circle')
 * ```
 */
export const guard = <S, A extends S>(predicate: (s: S) => s is A): Prism<S, A> =>
  makePrism<S, A>({
    get: (s) => (predicate(s) ? s : undefined),
    set: (a) => (s) => {
      if (typeof a === 'function') {
        if (!predicate(s)) return s
        const next = (a as (a: A) => A)(s)
        return Object.is(next, s) ? s : next
      }

      return Object.is(a, s) ? s : a
    },
  })

/**
 * Creates a prism focusing on a key in a `Record<string, V>`.
 * `get` returns `undefined` when the key is absent; `set` upserts the key.
 *
 * ```ts
 * const auth = at<string>('Authorization')
 * auth.get({ Authorization: 'Bearer x' }) // 'Bearer x'
 * auth.get({})                             // undefined
 * ```
 */
export const at = <V>(key: string): Prism<Readonly<Record<string, V>>, V> =>
  makePrism<Readonly<Record<string, V>>, V>({
    get: (s) => s[key],
    set: (v) => (s) => {
      const current = s[key]

      if (typeof v === 'function') {
        if (current === undefined) return s
        const next = (v as (v: V) => V)(current)
        return Object.is(next, current) ? s : { ...s, [key]: next }
      }

      if (current !== undefined && Object.is(v, current)) return s
      return { ...s, [key]: v }
    },
  })

/**
 * Creates a prism focusing on an array element by index.
 * `get` returns `undefined` when the index is out of bounds; `set` is a no-op when absent.
 */
export const index = <A>(idx: number): Prism<ReadonlyArray<A>, A> =>
  makePrism<ReadonlyArray<A>, A>({
    get: (items) => (hasIndex(items, idx) ? items[idx] : undefined),
    set: (valueOrFn) => (items) => {
      if (!hasIndex(items, idx)) return items

      const current = items[idx]!
      const next =
        typeof valueOrFn === 'function'
          ? (valueOrFn as (value: A) => A)(current)
          : valueOrFn

      return Object.is(next, current) ? items : setArraySlot(items, idx, next)
    },
  })

/**
 * Creates a traversal over all elements of a `ReadonlyArray<A>`.
 *
 * ```ts
 * const nums = each<number>()
 * nums.getAll([1, 2, 3])            // [1, 2, 3]
 * nums.modify(n => n * 2)([1, 2, 3]) // [2, 4, 6]
 * ```
 */
export const each = <A>(): Traversal<ReadonlyArray<A>, A> =>
  makeTraversal<ReadonlyArray<A>, A>({
    getAll: (s) => s,
    modify: (f) => (s) => mapArrayWithIdentity(s, f),
  })
