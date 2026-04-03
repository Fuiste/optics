/**
 * A functional lens that provides a way to access and modify nested data structures immutably.
 * @template S - The source type (the outer object)
 * @template A - The target type (the value being focused on)
 */
export type Lens<S, A> = {
  _tag: 'lens'
  /** Gets the value focused by the lens from the source object */
  get: (s: S) => A
  /** Sets a new value for the focused property, returning a new source object */
  set: (a: A | ((a: A) => A)) => <T extends S>(s: T) => T
  /** Composes this lens with another optic to create a more specific accessor */
  compose<B>(inner: Lens<A, B>): Lens<S, B>
  compose<B>(inner: Prism<A, B>): Prism<S, B>
  compose<B>(inner: Iso<A, B>): Lens<S, B>
  compose<B>(inner: Traversal<A, B>): Traversal<S, B>
}

/**
 * A functional prism that provides a way to access and modify optional or union data structures.
 * Unlike lenses, prisms can fail to get a value (returning undefined) and can handle union types.
 * @template S - The source type (the outer object)
 * @template A - The target type (the value being focused on)
 */
export type Prism<S, A> = {
  _tag: 'prism'
  /** Gets the value focused by the prism from the source object, may return undefined */
  get: (s: S) => A | undefined
  /** Sets a new value for the focused property, returning a new source object */
  set: (a: A | ((a: A) => A)) => <T extends S>(s: T) => T
  /** Composes this prism with another optic to create a more specific accessor */
  compose<B>(inner: Lens<A, B>): Prism<S, B>
  compose<B>(inner: Prism<A, B>): Prism<S, B>
  compose<B>(inner: Iso<A, B>): Prism<S, B>
  compose<B>(inner: Traversal<A, B>): Traversal<S, B>
}

/**
 * A traversal that focuses on zero or more values of type A within source S.
 * Unlike lenses and prisms, traversals can target multiple elements simultaneously,
 * making them ideal for collections like arrays.
 * @template S - The source type (the outer object)
 * @template A - The target type (the value being focused on)
 */
export type Traversal<S, A> = {
  _tag: 'traversal'
  /** Gets all values focused by the traversal from the source object */
  getAll: (s: S) => ReadonlyArray<A>
  /** Modifies all focused values using a function, returning a new source object */
  modify: (f: (a: A) => A) => <T extends S>(s: T) => T
  /** Composes this traversal with another optic to create a more specific accessor */
  compose<B>(inner: Lens<A, B>): Traversal<S, B>
  compose<B>(inner: Prism<A, B>): Traversal<S, B>
  compose<B>(inner: Iso<A, B>): Traversal<S, B>
  compose<B>(inner: Traversal<A, B>): Traversal<S, B>
}

/**
 * A total, invertible mapping (isomorphism) between two types.
 * @template S - The source type
 * @template A - The target type
 */
export type Iso<S, A> = {
  _tag: 'iso'
  /** Maps a value from S to A */
  to: (s: S) => A
  /** Maps a value from A back to S */
  from: (a: A) => S
}

/**
 * Extracts the source type from a lens type
 * @template L - The lens type to extract the source from
 * @example
 * ```typescript
 * const nameLens = Lens<Person>().prop('name')
 * type Person = InferLensSource<typeof nameLens> // Person
 * ```
 */
export type InferLensSource<L extends Lens<any, any>> = L extends Lens<infer S, any> ? S : never

/**
 * Extracts the target type from a lens type
 * @template L - The lens type to extract the target from
 * @example
 * ```typescript
 * const nameLens = Lens<Person>().prop('name')
 * type Name = InferLensTarget<typeof nameLens> // string
 * ```
 */
export type InferLensTarget<L extends Lens<any, any>> = L extends Lens<any, infer A> ? A : never

/**
 * Extracts the source type from a prism type
 * @template P - The prism type to extract the source from
 * @example
 * ```typescript
 * const addressPrism = Prism<Person>({ get: (p) => p.address, set: (a) => (p) => ({...p, address: a}) })
 * type Person = InferPrismSource<typeof addressPrism> // Person
 * ```
 */
export type InferPrismSource<P extends Prism<any, any>> = P extends Prism<infer S, any> ? S : never

/**
 * Extracts the target type from a prism type
 * @template P - The prism type to extract the target from
 * @example
 * ```typescript
 * const addressPrism = Prism<Person>({ get: (p) => p.address, set: (a) => (p) => ({...p, address: a}) })
 * type Address = InferPrismTarget<typeof addressPrism> // Address | undefined
 * ```
 */
export type InferPrismTarget<P extends Prism<any, any>> = P extends Prism<any, infer A> ? A : never

/**
 * Extracts the source type from an iso type
 */
export type InferIsoSource<I extends Iso<any, any>> = I extends Iso<infer S, any> ? S : never

/**
 * Extracts the target type from an iso type
 */
export type InferIsoTarget<I extends Iso<any, any>> = I extends Iso<any, infer A> ? A : never

/**
 * Extracts the source type from a traversal type
 */
export type InferTraversalSource<T extends Traversal<any, any>> =
  T extends Traversal<infer S, any> ? S : never

/**
 * Extracts the target type from a traversal type
 */
export type InferTraversalTarget<T extends Traversal<any, any>> =
  T extends Traversal<any, infer A> ? A : never

/**
 * Creates a new lens with the given getter and setter functions
 * @template S - The source type
 * @template A - The target type
 * @param get - Function to get the focused value from the source
 * @param set - Function to set a new value in the source
 * @returns A new lens with the provided getter and setter
 */
const makeLens = <S, A>(
  get: (s: S) => A,
  set: (a: A | ((a: A) => A)) => <T extends S>(s: T) => T,
): Lens<S, A> => {
  const lens: Lens<S, A> = {
    _tag: 'lens',
    get,
    set,
    compose<B>(inner: any): any {
      return compose(lens as any, inner)
    },
  }
  return lens
}

/**
 * Creates a new prism with the given getter and setter functions
 * @template S - The source type
 * @template A - The target type
 * @param prism - Object containing get and set functions
 * @returns A new prism with the provided getter and setter
 */
const makePrism = <S, A>(prism: {
  get: (s: S) => A | undefined
  set: (a: A | ((a: A) => A)) => <T extends S>(s: T) => T
}): Prism<S, A> => {
  const p: Prism<S, A> = {
    _tag: 'prism',
    ...prism,
    compose<B>(inner: any): any {
      return compose(p as any, inner)
    },
  }
  return p
}

/** Creates a new iso with the given to/from functions */
const makeIso = <S, A>(iso: { to: (s: S) => A; from: (a: A) => S }): Iso<S, A> => ({
  _tag: 'iso',
  ...iso,
})

/**
 * Creates a new traversal with the given getAll and modify functions
 * @template S - The source type
 * @template A - The target type
 * @param getAll - Function to get all focused values from the source
 * @param modify - Function to modify all focused values in the source
 * @returns A new traversal with the provided getter and modifier
 */
const makeTraversal = <S, A>(
  getAll: (s: S) => ReadonlyArray<A>,
  modify: (f: (a: A) => A) => <T extends S>(s: T) => T,
): Traversal<S, A> => {
  const traversal: Traversal<S, A> = {
    _tag: 'traversal',
    getAll,
    modify,
    compose<B>(inner: any): any {
      return compose(traversal as any, inner)
    },
  }
  return traversal
}

/**
 * Creates a lens for accessing a specific property of an object
 * @template S - The source object type
 * @template K - The key type (must be a key of S)
 * @param key - The property key to focus on
 * @returns A lens that focuses on the specified property
 */
const prop = <S, K extends keyof S>(key: K) =>
  makeLens<S, S[K]>(
    (s) => s[key],
    (a) => (s) => {
      const newA = typeof a === 'function' ? (a as (a: S[K]) => S[K])(s[key]) : a
      return { ...s, [key]: newA }
    },
  )

/**
 * Creates a traversal for iterating over array elements
 * @template A - The element type of the array
 * @returns A traversal that focuses on each element of the array
 */

/**
 * Universal compose function that handles all composition scenarios
 * Uses overloads to provide proper type inference
 */
function compose<S, A, B>(outer: Lens<S, A>, inner: Lens<A, B>): Lens<S, B>
function compose<S, A, B>(outer: Lens<S, A>, inner: Prism<A, B>): Prism<S, B>
function compose<S, A, B>(outer: Lens<S, A>, inner: Iso<A, B>): Lens<S, B>
function compose<S, A, B>(outer: Lens<S, A>, inner: Traversal<A, B>): Traversal<S, B>
function compose<S, A, B>(outer: Prism<S, A>, inner: Lens<A, B>): Prism<S, B>
function compose<S, A, B>(outer: Prism<S, A>, inner: Prism<A, B>): Prism<S, B>
function compose<S, A, B>(outer: Prism<S, A>, inner: Iso<A, B>): Prism<S, B>
function compose<S, A, B>(outer: Prism<S, A>, inner: Traversal<A, B>): Traversal<S, B>
function compose<S, A, B>(outer: Iso<S, A>, inner: Lens<A, B>): Lens<S, B>
function compose<S, A, B>(outer: Iso<S, A>, inner: Prism<A, B>): Prism<S, B>
function compose<S, A, B>(outer: Iso<S, A>, inner: Iso<A, B>): Iso<S, B>
function compose<S, A, B>(outer: Iso<S, A>, inner: Traversal<A, B>): Traversal<S, B>
function compose<S, A, B>(outer: Traversal<S, A>, inner: Lens<A, B>): Traversal<S, B>
function compose<S, A, B>(outer: Traversal<S, A>, inner: Prism<A, B>): Traversal<S, B>
function compose<S, A, B>(outer: Traversal<S, A>, inner: Iso<A, B>): Traversal<S, B>
function compose<S, A, B>(outer: Traversal<S, A>, inner: Traversal<A, B>): Traversal<S, B>
function compose<S, A, B>(
  outer: Lens<S, A> | Prism<S, A> | Iso<S, A> | Traversal<S, A>,
  inner: Lens<A, B> | Prism<A, B> | Iso<A, B> | Traversal<A, B>,
): Lens<S, B> | Prism<S, B> | Iso<S, B> | Traversal<S, B> {
  // Lens ∘ Lens => Lens
  if (outer._tag === 'lens' && inner._tag === 'lens') {
    const composedLens = makeLens(
      (s: S) => inner.get(outer.get(s)),
      (b: B | ((b: B) => B)) =>
        <T extends S>(s: T) => {
          const newA = inner.set(b)(outer.get(s))
          return outer.set(newA)(s)
        },
    )
    // Add compose method for chaining
    ;(composedLens as any).compose = <C>(i: any) => compose(composedLens as any, i)
    return composedLens
  }

  // Lens ∘ Iso => Lens
  if (outer._tag === 'lens' && inner._tag === 'iso') {
    const composedLens = makeLens<S, B>(
      (s: S) => inner.to(outer.get(s)),
      (b: B | ((b: B) => B)) =>
        <T extends S>(s: T) => {
          const currentA = outer.get(s)
          const nextB = typeof b === 'function' ? (b as (b: B) => B)(inner.to(currentA)) : b
          const newA = inner.from(nextB)
          return outer.set(newA)(s)
        },
    )
    ;(composedLens as any).compose = <C>(i: any) => compose(composedLens as any, i)
    return composedLens
  }

  // Iso ∘ Lens => Lens
  if (outer._tag === 'iso' && inner._tag === 'lens') {
    const composedLens = makeLens<S, B>(
      (s: S) => inner.get(outer.to(s)),
      (b: B | ((b: B) => B)) =>
        <T extends S>(s: T) => {
          const a = outer.to(s)
          const newA = inner.set(b)(a)
          return outer.from(newA) as T
        },
    )
    ;(composedLens as any).compose = <C>(i: any) => compose(composedLens as any, i)
    return composedLens
  }

  // Prism ∘ Iso => Prism
  if (outer._tag === 'prism' && inner._tag === 'iso') {
    const composedPrism = makePrism<S, B>({
      get: (s: S) => {
        const outerValue = outer.get(s)
        return outerValue === undefined ? undefined : inner.to(outerValue)
      },
      set:
        (b: B | ((b: B) => B)) =>
        <T extends S>(s: T) => {
          const outerValue = outer.get(s)
          if (typeof b === 'function') {
            if (outerValue === undefined) return s
            const currentB = inner.to(outerValue)
            const nextB = (b as (b: B) => B)(currentB)
            const newOuterValue = inner.from(nextB)
            return outer.set(newOuterValue)(s)
          }
          // When provided a concrete value, materialize via outer.set even if missing
          const newOuterValue = inner.from(b as B)
          return outer.set(newOuterValue)(s)
        },
    })
    ;(composedPrism as any).compose = <C>(i: any) => compose(composedPrism as any, i)
    return composedPrism
  }

  // Iso ∘ Prism => Prism
  if (outer._tag === 'iso' && inner._tag === 'prism') {
    const composedPrism = makePrism<S, B>({
      get: (s: S) => inner.get(outer.to(s)),
      set:
        (b: B | ((b: B) => B)) =>
        <T extends S>(s: T) => {
          const a = outer.to(s)
          const newA = inner.set(b)(a)
          return outer.from(newA) as T
        },
    })
    ;(composedPrism as any).compose = <C>(i: any) => compose(composedPrism as any, i)
    return composedPrism
  }

  // Iso ∘ Iso => Iso
  if (outer._tag === 'iso' && inner._tag === 'iso') {
    return makeIso<S, B>({
      to: (s: S) => inner.to(outer.to(s)),
      from: (b: B) => outer.from(inner.from(b)),
    })
  }

  // Lens ∘ Traversal => Traversal
  if (outer._tag === 'lens' && inner._tag === 'traversal') {
    const composedTraversal = makeTraversal<S, B>(
      (s: S) => inner.getAll(outer.get(s)),
      (f) =>
        <T extends S>(s: T) => {
          const a = outer.get(s)
          const newA = inner.modify(f)(a)
          return outer.set(newA)(s)
        },
    )
    ;(composedTraversal as any).compose = <C>(i: any) => compose(composedTraversal as any, i)
    return composedTraversal
  }

  // Prism ∘ Traversal => Traversal
  if (outer._tag === 'prism' && inner._tag === 'traversal') {
    const composedTraversal = makeTraversal<S, B>(
      (s: S) => {
        const a = outer.get(s)
        return a === undefined ? [] : inner.getAll(a)
      },
      (f) =>
        <T extends S>(s: T) => {
          const a = outer.get(s)
          if (a === undefined) return s
          // Collect all unique values after transformation, then set them back
          const allValues = inner.getAll(a)
          const transformedMap = new Map(allValues.map((v) => [String(v), f(v)]))
          let modifiedA = a
          for (const [, newVal] of transformedMap) {
            modifiedA = inner.modify(() => newVal)(modifiedA as any)
          }
          return outer.set(modifiedA)(s)
        },
    )
    ;(composedTraversal as any).compose = <C>(i: any) => compose(composedTraversal as any, i)
    return composedTraversal
  }

  // Iso ∘ Traversal => Traversal
  if (outer._tag === 'iso' && inner._tag === 'traversal') {
    const composedTraversal = makeTraversal<S, B>(
      (s: S) => inner.getAll(outer.to(s)),
      (f) =>
        <T extends S>(s: T) => {
          const a = outer.to(s)
          let modifiedA = a
          for (const val of inner.getAll(a)) {
            modifiedA = inner.modify(() => f(val as B))(modifiedA as any)
          }
          return outer.from(modifiedA) as T
        },
    )
    ;(composedTraversal as any).compose = <C>(i: any) => compose(composedTraversal as any, i)
    return composedTraversal
  }

  // Traversal ∘ Lens => Traversal
  if (outer._tag === 'traversal' && inner._tag === 'lens') {
    const composedTraversal = makeTraversal<S, B>(
      (s: S) => outer.getAll(s).flatMap((a) => [inner.get(a)]),
      (f) =>
        <T extends S>(s: T) => {
          let modifiedS = s
          for (const a of outer.getAll(s)) {
            const newA = inner.set(f)(a)
            // Apply the modified A back through outer traversal
            modifiedS = outer.modify((x: any) => (x === a ? newA : x))(modifiedS as any)
          }
          return modifiedS
        },
    )
    ;(composedTraversal as any).compose = <C>(i: any) => compose(composedTraversal as any, i)
    return composedTraversal
  }

  // Traversal ∘ Prism => Traversal
  if (outer._tag === 'traversal' && inner._tag === 'prism') {
    const composedTraversal = makeTraversal<S, B>(
      (s: S) =>
        outer.getAll(s).flatMap((a) => {
          const v = inner.get(a)
          return v !== undefined ? [v] : []
        }) as B[],
      (f) =>
        <T extends S>(s: T) => {
          let modifiedS = s
          for (const a of outer.getAll(s)) {
            const bVal = inner.get(a)
            if (bVal !== undefined) {
              const newA = inner.set(f(bVal))(a)
              modifiedS = outer.modify((x: any) => (x === a ? newA : x))(modifiedS as any)
            }
          }
          return modifiedS
        },
    )
    ;(composedTraversal as any).compose = <C>(i: any) => compose(composedTraversal as any, i)
    return composedTraversal
    ;(composedTraversal as any).compose = <C>(i: any) => compose(composedTraversal as any, i)
    return composedTraversal
  }

  // Traversal ∘ Iso => Traversal
  if (outer._tag === 'traversal' && inner._tag === 'iso') {
    const composedTraversal = makeTraversal<S, B>(
      (s: S) => outer.getAll(s).map((a) => inner.to(a)),
      (f) =>
        <T extends S>(s: T) => {
          let modifiedS = s
          for (const a of outer.getAll(s)) {
            const bVal = inner.to(a)
            const newB = f(bVal)
            const newA = inner.from(newB)
            modifiedS = outer.modify((x: any) => (x === a ? newA : x))(modifiedS as any)
          }
          return modifiedS
        },
    )
    ;(composedTraversal as any).compose = <C>(i: any) => compose(composedTraversal as any, i)
    return composedTraversal
  }

  // Traversal ∘ Traversal => Traversal
  if (outer._tag === 'traversal' && inner._tag === 'traversal') {
    const composedTraversal = makeTraversal<S, B>(
      (s: S) => outer.getAll(s).flatMap((a) => inner.getAll(a)) as B[],
      (f) =>
        <T extends S>(s: T) => {
          // Use the outer traversal to modify each element through inner traversal
          return outer.modify((outerVal: any) => inner.modify(f)(outerVal))(s)
        },
    )
    ;(composedTraversal as any).compose = <C>(i: any) => compose(composedTraversal as any, i)
    return composedTraversal
  }

  // Otherwise, return a Prism
  return makePrism<S, B>({
    get: (s: S) => {
      const o = outer as Lens<S, A> | Prism<S, A>
      const outerValue = o.get(s as S)
      if (outerValue === undefined) return undefined
      // inner could be lens or prism
      // lens.get returns B, prism.get returns B | undefined
      return (inner as Lens<A, B> | Prism<A, B>).get(outerValue as A)
    },
    set:
      (b: B | ((b: B) => B)) =>
      <T extends S>(s: T) => {
        const o = outer as Lens<S, A> | Prism<S, A>
        const outerValue = o.get(s as S)
        if (outerValue === undefined) return s
        const newOuterValue = (inner as Lens<A, B> | Prism<A, B>).set(b)(outerValue as A)
        return o.set(newOuterValue as A)(s as T)
      },
  })
}

/**
 * Creates a type-safe lens factory for a given source type
 * @template S - The source type to create lenses for
 * @returns An object with methods to create and compose lenses
 */
const createLens = <S>() => {
  function composeForLens<A, B>(outer: Lens<S, A>, inner: Lens<A, B>): Lens<S, B>
  function composeForLens<A, B>(outer: Lens<S, A>, inner: Prism<A, B>): Prism<S, B>
  function composeForLens<A, B>(outer: Lens<S, A>, inner: Iso<A, B>): Lens<S, B>
  function composeForLens<A, B>(outer: Lens<S, A>, inner: Traversal<A, B>): Traversal<S, B>
  function composeForLens<A, B>(
    outer: Lens<S, A>,
    inner: Lens<A, B> | Prism<A, B> | Iso<A, B> | Traversal<A, B>,
  ): Lens<S, B> | Prism<S, B> | Traversal<S, B> {
    return inner._tag === 'lens'
      ? (compose(outer, inner) as Lens<S, B>)
      : inner._tag === 'prism'
        ? (compose(outer, inner) as Prism<S, B>)
        : inner._tag === 'traversal'
          ? (compose(outer, inner) as Traversal<S, B>)
          : (compose(outer, inner) as Lens<S, B>)
  }

  return {
    /** Creates a lens for a specific property of the source type */
    prop: <K extends keyof S>(key: K) => prop<S, K>(key),
    /** Composes this lens with another lens, prism, or traversal */
    compose: composeForLens,
  }
}

/**
 * Creates a type-safe prism factory for a given source type
 * @template S - The source type to create prisms for
 * @returns An object with methods to create and compose prisms
 */
const createPrism = <S>() => {
  function composeForPrism<A, B>(outer: Prism<S, A>, inner: Lens<A, B>): Prism<S, B>
  function composeForPrism<A, B>(outer: Prism<S, A>, inner: Prism<A, B>): Prism<S, B>
  function composeForPrism<A, B>(outer: Prism<S, A>, inner: Iso<A, B>): Prism<S, B>
  function composeForPrism<A, B>(outer: Prism<S, A>, inner: Traversal<A, B>): Traversal<S, B>
  function composeForPrism<A, B>(
    outer: Prism<S, A>,
    inner: Lens<A, B> | Prism<A, B> | Iso<A, B> | Traversal<A, B>,
  ): Prism<S, B> | Traversal<S, B> {
    const withLens = <A0, B0>(o: Prism<S, A0>, i: Lens<A0, B0>) => compose(o, i)
    const withPrism = <A0, B0>(o: Prism<S, A0>, i: Prism<A0, B0>) => compose(o, i)
    const withIso = <A0, B0>(o: Prism<S, A0>, i: Iso<A0, B0>) => compose(o, i)
    const withTraversal = <A0, B0>(o: Prism<S, A0>, i: Traversal<A0, B0>) => compose(o, i)
    return inner._tag === 'lens'
      ? (withLens(outer, inner) as Prism<S, B>)
      : inner._tag === 'prism'
        ? (withPrism(outer, inner) as Prism<S, B>)
        : inner._tag === 'traversal'
          ? (withTraversal(outer, inner) as Traversal<S, B>)
          : (withIso(outer, inner) as Prism<S, B>)
  }

  function of<A>(prism: { get: (s: S) => A | undefined; set: (a: A) => (s: S) => S }): Prism<S, A>
  function of<A>(prism: {
    get: (s: S) => A | undefined
    set: (a: A | ((a: A) => A)) => <T extends S>(s: T) => T
  }): Prism<S, A>
  function of<A>(prism: {
    get: (s: S) => A | undefined
    set: ((a: A) => (s: S) => S) | ((a: A | ((a: A) => A)) => <T extends S>(s: T) => T)
  }): Prism<S, A> {
    const normalized = makePrism<S, A>({
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
    })
    return normalized
  }

  return {
    /** Creates a prism with custom get and set functions */
    of,
    /** Composes this prism with another lens, prism, or traversal */
    compose: composeForPrism,
  }
}

/**
 * Creates a type-safe traversal factory for a given source type
 * @template S - The source type to create traversals for
 * @returns An object with methods to create and compose traversals
 */
const createTraversal = <S>() => {
  function composeForTraversal<A, B>(outer: Traversal<S, A>, inner: Lens<A, B>): Traversal<S, B>
  function composeForTraversal<A, B>(outer: Traversal<S, A>, inner: Prism<A, B>): Traversal<S, B>
  function composeForTraversal<A, B>(outer: Traversal<S, A>, inner: Iso<A, B>): Traversal<S, B>
  function composeForTraversal<A, B>(
    outer: Traversal<S, A>,
    inner: Traversal<A, B>,
  ): Traversal<S, B>
  function composeForTraversal<A, B>(
    outer: Traversal<S, A>,
    inner: Lens<A, B> | Prism<A, B> | Iso<A, B> | Traversal<A, B>,
  ): Traversal<S, B> {
    return compose(outer, inner) as Traversal<S, B>
  }

  function of<A>(traversal: {
    getAll: (s: S) => ReadonlyArray<A>
    modify: (f: (a: A) => A) => <T extends S>(s: T) => T
  }): Traversal<S, A> {
    return makeTraversal(traversal.getAll, traversal.modify)
  }

  return {
    /** Creates a traversal with custom getAll and modify functions */
    of,
    /** Composes this traversal with another optic */
    compose: composeForTraversal,
  }
}

export const Lens = createLens
export const Prism = createPrism
export const Iso = makeIso
export const Traversal = createTraversal

/**
 * A traversal that accesses all elements in an array (or similar iterable)
 * @returns A traversal from Array<A> to A for all elements
 */
export function each<A>(): Traversal<ArrayLike<A>, A> {
  return makeTraversal(
    <A0>(arr: ReadonlyArray<A0>): A0[] => [...arr],
    (f) =>
      <T extends ArrayLike<A>>(arr: T): T => {
        const newArr = Array.from(arr).map(f)
        // Preserve array-like structure
        if (Array.isArray(arr)) return newArr as unknown as T
        ;(newArr as any).length = arr.length
        return newArr as unknown as T
      },
  )
}
