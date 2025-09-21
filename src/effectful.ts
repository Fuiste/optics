import { Data, Exit } from 'effect'
import type { Iso as BaseIso, Lens as BaseLens, Prism as BasePrism } from './index'
import { Iso as makeBaseIso, Lens as BaseLensFactory, Prism as BasePrismFactory } from './index'

// Errors
export class EffectPrismNotFound extends Data.TaggedError('EffectPrismNotFound')<{
  path?: string
}> {}

export class EffectPrismNoOpSet extends Data.TaggedError('EffectPrismNoOpSet')<{
  reason: 'missing' | 'unchanged'
  path?: string
}> {}

// Effectful optic types
export type EffectLens<S, A> = {
  _tag: 'effect/lens'
  get: (s: S) => Exit.Exit<A, never>
  set: (a: A | ((a: A) => A)) => <T extends S>(s: T) => Exit.Exit<T, never>
}

export type EffectPrism<S, A> = {
  _tag: 'effect/prism'
  get: (s: S) => Exit.Exit<A, EffectPrismNotFound>
  set: (a: A | ((a: A) => A)) => <T extends S>(s: T) => Exit.Exit<T, EffectPrismNoOpSet>
}

export type EffectIso<S, A> = {
  _tag: 'effect/iso'
  to: (s: S) => Exit.Exit<A, never>
  from: (a: A) => Exit.Exit<S, never>
}

// Internal wrappers to retain base optics for composition
type WrappedEffectLens<S, A> = EffectLens<S, A> & { __base: BaseLens<S, A> }
type WrappedEffectPrism<S, A> = EffectPrism<S, A> & { __base: BasePrism<S, A> }
type WrappedEffectIso<S, A> = EffectIso<S, A> & { __base: BaseIso<S, A> }

const wrapLens = <S, A>(base: BaseLens<S, A>): WrappedEffectLens<S, A> => ({
  _tag: 'effect/lens',
  __base: base,
  get: (s) => Exit.succeed(base.get(s)),
  set: (a) => (s) => Exit.succeed(base.set(a)(s)),
})

const wrapPrism = <S, A>(base: BasePrism<S, A>, path?: string): WrappedEffectPrism<S, A> => ({
  _tag: 'effect/prism',
  __base: base,
  get: (s) => {
    const v = base.get(s)
    if (v === undefined) {
      if (path === undefined) return Exit.fail(new EffectPrismNotFound({}))
      return Exit.fail(new EffectPrismNotFound({ path: path as string }))
    }
    return Exit.succeed(v)
  },
  set:
    (a) =>
    <T extends S>(s: T) => {
      const updated = base.set(a)(s)
      if (updated === s) {
        if (path === undefined) return Exit.fail(new EffectPrismNoOpSet({ reason: 'missing' }))
        return Exit.fail(new EffectPrismNoOpSet({ reason: 'missing', path: path as string }))
      }
      return Exit.succeed(updated)
    },
})

const wrapIso = <S, A>(base: BaseIso<S, A>): WrappedEffectIso<S, A> => ({
  _tag: 'effect/iso',
  __base: base,
  to: (s) => Exit.succeed(base.to(s)),
  from: (a) => Exit.succeed(base.from(a)),
})

// Universal compose for effectful optics (structural, mirrors base compose semantics)
function composeEffect<S, A, B>(
  outer: WrappedEffectLens<S, A> | WrappedEffectPrism<S, A> | WrappedEffectIso<S, A>,
  inner: WrappedEffectLens<A, B> | WrappedEffectPrism<A, B> | WrappedEffectIso<A, B>,
): WrappedEffectLens<S, B> | WrappedEffectPrism<S, B> | WrappedEffectIso<S, B> {
  const ob = (outer as any).__base as BaseLens<S, A> | BasePrism<S, A> | BaseIso<S, A>
  const ib = (inner as any).__base as BaseLens<A, B> | BasePrism<A, B> | BaseIso<A, B>

  // Lens ∘ Lens => Lens
  if ((ob as any)._tag === 'lens' && (ib as any)._tag === 'lens') {
    const composed: BaseLens<S, B> = {
      _tag: 'lens',
      get: (s: S) => (ib as BaseLens<A, B>).get((ob as BaseLens<S, A>).get(s)),
      set: (b: B | ((b: B) => B)) => <T extends S>(s: T) => {
        const newA = (ib as BaseLens<A, B>).set(b)((ob as BaseLens<S, A>).get(s))
        return (ob as BaseLens<S, A>).set(newA)(s)
      },
    }
    return wrapLens(composed)
  }

  // Lens ∘ Iso => Lens
  if ((ob as any)._tag === 'lens' && (ib as any)._tag === 'iso') {
    const composed: BaseLens<S, B> = {
      _tag: 'lens',
      get: (s: S) => (ib as BaseIso<A, B>).to((ob as BaseLens<S, A>).get(s)),
      set: (b: B | ((b: B) => B)) => <T extends S>(s: T) => {
        const currentA = (ob as BaseLens<S, A>).get(s)
        const nextB = typeof b === 'function' ? (b as (b: B) => B)((ib as BaseIso<A, B>).to(currentA)) : (b as B)
        const newA = (ib as BaseIso<A, B>).from(nextB)
        return (ob as BaseLens<S, A>).set(newA)(s)
      },
    }
    return wrapLens(composed)
  }

  // Iso ∘ Lens => Lens
  if ((ob as any)._tag === 'iso' && (ib as any)._tag === 'lens') {
    const composed: BaseLens<S, B> = {
      _tag: 'lens',
      get: (s: S) => (ib as BaseLens<A, B>).get((ob as BaseIso<S, A>).to(s)),
      set: (b: B | ((b: B) => B)) => <T extends S>(s: T) => {
        const a = (ob as BaseIso<S, A>).to(s)
        const newA = (ib as BaseLens<A, B>).set(b)(a)
        return (ob as BaseIso<S, A>).from(newA) as T
      },
    }
    return wrapLens(composed)
  }

  // Prism ∘ Iso => Prism
  if ((ob as any)._tag === 'prism' && (ib as any)._tag === 'iso') {
    const composed: BasePrism<S, B> = {
      _tag: 'prism',
      get: (s: S) => {
        const outerValue = (ob as BasePrism<S, A>).get(s)
        return outerValue === undefined ? undefined : (ib as BaseIso<A, B>).to(outerValue)
      },
      set: (b: B | ((b: B) => B)) => <T extends S>(s: T) => {
        const outerValue = (ob as BasePrism<S, A>).get(s)
        if (typeof b === 'function') {
          if (outerValue === undefined) return s
          const currentB = (ib as BaseIso<A, B>).to(outerValue)
          const nextB = (b as (b: B) => B)(currentB)
          const newOuterValue = (ib as BaseIso<A, B>).from(nextB)
          return (ob as BasePrism<S, A>).set(newOuterValue)(s)
        }
        const newOuterValue = (ib as BaseIso<A, B>).from(b as B)
        return (ob as BasePrism<S, A>).set(newOuterValue)(s)
      },
    }
    return wrapPrism<S, B>(composed)
  }

  // Iso ∘ Prism => Prism
  if ((ob as any)._tag === 'iso' && (ib as any)._tag === 'prism') {
    const composed: BasePrism<S, B> = {
      _tag: 'prism',
      get: (s: S) => (ib as BasePrism<A, B>).get((ob as BaseIso<S, A>).to(s)),
      set: (b: B | ((b: B) => B)) => <T extends S>(s: T) => {
        const a = (ob as BaseIso<S, A>).to(s)
        const newA = (ib as BasePrism<A, B>).set(b)(a)
        return (ob as BaseIso<S, A>).from(newA) as T
      },
    }
    return wrapPrism<S, B>(composed)
  }

  // Iso ∘ Iso => Iso
  if ((ob as any)._tag === 'iso' && (ib as any)._tag === 'iso') {
    const composed: BaseIso<S, B> = makeBaseIso<S, B>({
      to: (s: S) => (ib as BaseIso<A, B>).to((ob as BaseIso<S, A>).to(s)),
      from: (b: B) => (ob as BaseIso<S, A>).from((ib as BaseIso<A, B>).from(b)),
    })
    return wrapIso(composed)
  }

  // Otherwise, a Prism (handles Lens ∘ Prism, Prism ∘ Lens, Prism ∘ Prism)
  const composed: BasePrism<S, B> = {
    _tag: 'prism',
    get: (s: S) => {
      const outerValue = (ob as BaseLens<S, A> | BasePrism<S, A>).get(s as S)
      if (outerValue === undefined) return undefined
      return (ib as BaseLens<A, B> | BasePrism<A, B>).get(outerValue as A)
    },
    set: (b: B | ((b: B) => B)) => <T extends S>(s: T) => {
      const outerValue = (ob as BaseLens<S, A> | BasePrism<S, A>).get(s as S)
      if (outerValue === undefined) return s
      const newOuterValue = (ib as BaseLens<A, B> | BasePrism<A, B>).set(b)(outerValue as A)
      return (ob as BaseLens<S, A> | BasePrism<S, A>).set(newOuterValue as A)(s as T)
    },
  }
  return wrapPrism<S, B>(composed)
}

// Factories mirroring the base API
const createEffectLens = <S>() => {
  function composeForLens<A, B>(outer: WrappedEffectLens<S, A>, inner: WrappedEffectLens<A, B>): WrappedEffectLens<S, B>
  function composeForLens<A, B>(outer: WrappedEffectLens<S, A>, inner: WrappedEffectPrism<A, B>): WrappedEffectPrism<S, B>
  function composeForLens<A, B>(outer: WrappedEffectLens<S, A>, inner: WrappedEffectIso<A, B>): WrappedEffectLens<S, B>
  function composeForLens<A, B>(
    outer: WrappedEffectLens<S, A>,
    inner: WrappedEffectLens<A, B> | WrappedEffectPrism<A, B> | WrappedEffectIso<A, B>,
  ): WrappedEffectLens<S, B> | WrappedEffectPrism<S, B> {
    return composeEffect(outer, inner) as WrappedEffectLens<S, B> | WrappedEffectPrism<S, B>
  }

  return {
    prop: <K extends keyof S>(key: K): WrappedEffectLens<S, S[K]> => wrapLens(BaseLensFactory<S>().prop(key)),
    compose: composeForLens,
  }
}

const createEffectPrism = <S>() => {
  function composeForPrism<A, B>(outer: WrappedEffectPrism<S, A>, inner: WrappedEffectLens<A, B>): WrappedEffectPrism<S, B>
  function composeForPrism<A, B>(outer: WrappedEffectPrism<S, A>, inner: WrappedEffectPrism<A, B>): WrappedEffectPrism<S, B>
  function composeForPrism<A, B>(outer: WrappedEffectPrism<S, A>, inner: WrappedEffectIso<A, B>): WrappedEffectPrism<S, B>
  function composeForPrism<A, B>(
    outer: WrappedEffectPrism<S, A>,
    inner: WrappedEffectLens<A, B> | WrappedEffectPrism<A, B> | WrappedEffectIso<A, B>,
  ): WrappedEffectPrism<S, B> {
    return composeEffect(outer, inner) as WrappedEffectPrism<S, B>
  }

  function of<A>(prism: { get: (s: S) => A | undefined; set: (a: A) => (s: S) => S }): WrappedEffectPrism<S, A>
  function of<A>(prism: {
    get: (s: S) => A | undefined
    set: (a: A | ((a: A) => A)) => <T extends S>(s: T) => T
  }): WrappedEffectPrism<S, A>
  function of<A>(prism: {
    get: (s: S) => A | undefined
    set: ((a: A) => (s: S) => S) | ((a: A | ((a: A) => A)) => <T extends S>(s: T) => T)
  }): WrappedEffectPrism<S, A> {
    const base = BasePrismFactory<S>().of<A>(prism as any) as BasePrism<S, A>
    return wrapPrism<S, A>(base)
  }

  return {
    of,
    compose: composeForPrism,
  }
}

const makeEffectIso = <S, A>(iso: { to: (s: S) => A; from: (a: A) => S }): WrappedEffectIso<S, A> => wrapIso(makeBaseIso(iso))

export const EffectLens = createEffectLens
export const EffectPrism = createEffectPrism
export const EffectIso = makeEffectIso


