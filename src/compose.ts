import type { Lens, Prism, Iso, Traversal, Getter, Fold, Optic } from './types.js'
import { resolve } from './_internal.js'
import { makeLens } from './lens.js'
import { makePrism } from './prism.js'
import { makeIso } from './iso.js'
import { makeTraversal } from './traversal.js'
import { makeGetter } from './getter.js'
import { makeFold } from './fold.js'

// ── Internal helpers ──────────────────────────────────────────────────

type Tag = Optic['_tag']

const resultTag = (outer: Tag, inner: Tag): Tag => {
  if (outer === 'fold' || inner === 'fold') return 'fold'
  if (outer === 'getter' || inner === 'getter') {
    const hasPartial =
      outer === 'prism' || inner === 'prism' ||
      outer === 'traversal' || inner === 'traversal'
    return hasPartial ? 'fold' : 'getter'
  }
  if (outer === 'traversal' || inner === 'traversal') return 'traversal'
  if (outer === 'iso' && inner === 'iso') return 'iso'
  if (outer === 'iso') return inner
  if (inner === 'iso') return outer
  if (outer === 'lens' && inner === 'lens') return 'lens'
  return 'prism'
}

/** Total getter for Lens, Getter, or Iso. */
const totalGet = (o: Optic): ((s: any) => any) =>
  o._tag === 'iso' ? o.to : (o as Lens<any, any> | Getter<any, any>).get

/** Normalize any optic to a multi-value getter. */
const allValues = (o: Optic) => (s: any): ReadonlyArray<any> => {
  switch (o._tag) {
    case 'lens':
    case 'getter':
      return [o.get(s)]
    case 'iso':
      return [o.to(s)]
    case 'prism': {
      const v = o.get(s)
      return v === undefined ? [] : [v]
    }
    case 'traversal':
    case 'fold':
      return o.getAll(s)
  }
}

/** Apply a modification function through any writable optic. */
const modThrough = (o: Optic) => (f: (a: any) => any) =>
  <T>(s: T): T => {
    switch (o._tag) {
      case 'lens':
        return o.set(f(o.get(s)))(s) as T
      case 'prism': {
        const v = o.get(s)
        return (v === undefined ? s : o.set(f(v))(s)) as T
      }
      case 'iso':
        return o.from(f(o.to(s))) as unknown as T
      case 'traversal':
        return o.modify(f)(s)
      default:
        return s
    }
  }

// ── Overloads ─────────────────────────────────────────────────────────
// Grouped by result type for readability.

// Iso result (1)
export function compose<S, A, B>(outer: Iso<S, A>, inner: Iso<A, B>): Iso<S, B>

// Lens result (3)
export function compose<S, A, B>(outer: Lens<S, A>, inner: Lens<A, B>): Lens<S, B>
export function compose<S, A, B>(outer: Lens<S, A>, inner: Iso<A, B>): Lens<S, B>
export function compose<S, A, B>(outer: Iso<S, A>, inner: Lens<A, B>): Lens<S, B>

// Getter result (5)
export function compose<S, A, B>(outer: Lens<S, A>, inner: Getter<A, B>): Getter<S, B>
export function compose<S, A, B>(outer: Getter<S, A>, inner: Lens<A, B>): Getter<S, B>
export function compose<S, A, B>(outer: Iso<S, A>, inner: Getter<A, B>): Getter<S, B>
export function compose<S, A, B>(outer: Getter<S, A>, inner: Iso<A, B>): Getter<S, B>
export function compose<S, A, B>(outer: Getter<S, A>, inner: Getter<A, B>): Getter<S, B>

// Prism result (5)
export function compose<S, A, B>(outer: Lens<S, A>, inner: Prism<A, B>): Prism<S, B>
export function compose<S, A, B>(outer: Prism<S, A>, inner: Lens<A, B>): Prism<S, B>
export function compose<S, A, B>(outer: Prism<S, A>, inner: Prism<A, B>): Prism<S, B>
export function compose<S, A, B>(outer: Prism<S, A>, inner: Iso<A, B>): Prism<S, B>
export function compose<S, A, B>(outer: Iso<S, A>, inner: Prism<A, B>): Prism<S, B>

// Traversal result (7)
export function compose<S, A, B>(outer: Lens<S, A>, inner: Traversal<A, B>): Traversal<S, B>
export function compose<S, A, B>(outer: Traversal<S, A>, inner: Lens<A, B>): Traversal<S, B>
export function compose<S, A, B>(outer: Prism<S, A>, inner: Traversal<A, B>): Traversal<S, B>
export function compose<S, A, B>(outer: Traversal<S, A>, inner: Prism<A, B>): Traversal<S, B>
export function compose<S, A, B>(outer: Traversal<S, A>, inner: Traversal<A, B>): Traversal<S, B>
export function compose<S, A, B>(outer: Iso<S, A>, inner: Traversal<A, B>): Traversal<S, B>
export function compose<S, A, B>(outer: Traversal<S, A>, inner: Iso<A, B>): Traversal<S, B>

// Fold result (15)
export function compose<S, A, B>(outer: Lens<S, A>, inner: Fold<A, B>): Fold<S, B>
export function compose<S, A, B>(outer: Prism<S, A>, inner: Getter<A, B>): Fold<S, B>
export function compose<S, A, B>(outer: Prism<S, A>, inner: Fold<A, B>): Fold<S, B>
export function compose<S, A, B>(outer: Traversal<S, A>, inner: Getter<A, B>): Fold<S, B>
export function compose<S, A, B>(outer: Traversal<S, A>, inner: Fold<A, B>): Fold<S, B>
export function compose<S, A, B>(outer: Getter<S, A>, inner: Prism<A, B>): Fold<S, B>
export function compose<S, A, B>(outer: Getter<S, A>, inner: Traversal<A, B>): Fold<S, B>
export function compose<S, A, B>(outer: Getter<S, A>, inner: Fold<A, B>): Fold<S, B>
export function compose<S, A, B>(outer: Fold<S, A>, inner: Lens<A, B>): Fold<S, B>
export function compose<S, A, B>(outer: Fold<S, A>, inner: Prism<A, B>): Fold<S, B>
export function compose<S, A, B>(outer: Fold<S, A>, inner: Iso<A, B>): Fold<S, B>
export function compose<S, A, B>(outer: Fold<S, A>, inner: Traversal<A, B>): Fold<S, B>
export function compose<S, A, B>(outer: Fold<S, A>, inner: Getter<A, B>): Fold<S, B>
export function compose<S, A, B>(outer: Fold<S, A>, inner: Fold<A, B>): Fold<S, B>
export function compose<S, A, B>(outer: Iso<S, A>, inner: Fold<A, B>): Fold<S, B>

// ── Implementation ────────────────────────────────────────────────────

export function compose(outer: Optic, inner: Optic): Optic {
  const tag = resultTag(outer._tag, inner._tag)

  if (tag === 'iso')
    return makeIso({
      to: (s: any) => (inner as Iso<any, any>).to((outer as Iso<any, any>).to(s)),
      from: (b: any) => (outer as Iso<any, any>).from((inner as Iso<any, any>).from(b)),
    })

  if (tag === 'fold')
    return makeFold((s: any) =>
      allValues(outer)(s).flatMap(allValues(inner)),
    )

  if (tag === 'getter')
    return makeGetter((s: any) => totalGet(inner)(totalGet(outer)(s)))

  if (tag === 'traversal')
    return makeTraversal({
      getAll: (s: any) => allValues(outer)(s).flatMap(allValues(inner)),
      modify: (f: (a: any) => any) =>
        <T>(s: T) =>
          modThrough(outer)((a: any) => modThrough(inner)(f)(a))(s),
    })

  if (tag === 'lens')
    return makeLens(
      (s: any) => totalGet(inner)(totalGet(outer)(s)),
      (b: any) =>
        <T>(s: T) =>
          modThrough(outer)((a: any) =>
            inner._tag === 'iso'
              ? (inner as Iso<any, any>).from(resolve(b, (inner as Iso<any, any>).to(a)))
              : (inner as Lens<any, any>).set(b)(a),
          )(s),
    )

  // tag === 'prism'
  // Prism ∘ Iso: concrete values materialize even when outer.get is undefined
  if (inner._tag === 'iso') {
    const iso = inner as Iso<any, any>
    return makePrism({
      get: (s: any) => {
        const a = (outer as Prism<any, any>).get(s)
        return a === undefined ? undefined : iso.to(a)
      },
      set:
        (b: any) =>
        <T>(s: T) => {
          if (typeof b === 'function') {
            const a = (outer as Prism<any, any>).get(s)
            if (a === undefined) return s
            return (outer as Prism<any, any>).set(iso.from((b as (x: any) => any)(iso.to(a))))(s) as T
          }
          return (outer as Prism<any, any>).set(iso.from(b))(s) as T
        },
    })
  }

  // General prism composition
  return makePrism({
    get: (s: any) => {
      const outerVals = allValues(outer)(s)
      if (outerVals.length === 0) return undefined
      const innerVals = allValues(inner)(outerVals[0]!)
      return innerVals.length === 0 ? undefined : innerVals[0]
    },
    set:
      (b: any) =>
      <T>(s: T) =>
        modThrough(outer)((a: any) => (inner as Lens<any, any> | Prism<any, any>).set(b)(a))(s),
  })
}
