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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InferLensSource<L extends Lens<any, any>> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  L extends Lens<infer S, any> ? S : never

/**
 * Extracts the target type from a lens type
 * @template L - The lens type to extract the target from
 * @example
 * ```typescript
 * const nameLens = Lens<Person>().prop('name')
 * type Name = InferLensTarget<typeof nameLens> // string
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InferLensTarget<L extends Lens<any, any>> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  L extends Lens<any, infer A> ? A : never

/**
 * Extracts the source type from a prism type
 * @template P - The prism type to extract the source from
 * @example
 * ```typescript
 * const addressPrism = Prism<Person>({ get: (p) => p.address, set: (a) => (p) => ({...p, address: a}) })
 * type Person = InferPrismSource<typeof addressPrism> // Person
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InferPrismSource<P extends Prism<any, any>> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  P extends Prism<infer S, any> ? S : never

/**
 * Extracts the target type from a prism type
 * @template P - The prism type to extract the target from
 * @example
 * ```typescript
 * const addressPrism = Prism<Person>({ get: (p) => p.address, set: (a) => (p) => ({...p, address: a}) })
 * type Address = InferPrismTarget<typeof addressPrism> // Address | undefined
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InferPrismTarget<P extends Prism<any, any>> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  P extends Prism<any, infer A> ? A : never

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
): Lens<S, A> => ({
  _tag: 'lens',
  get,
  set,
})

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
}): Prism<S, A> => ({
  _tag: 'prism',
  ...prism,
})

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
 * Universal compose function that handles all composition scenarios
 * Uses overloads to provide proper type inference
 */
function compose<S, A, B>(outer: Lens<S, A>, inner: Lens<A, B>): Lens<S, B>
function compose<S, A, B>(outer: Lens<S, A>, inner: Prism<A, B>): Prism<S, B>
function compose<S, A, B>(outer: Prism<S, A>, inner: Lens<A, B>): Prism<S, B>
function compose<S, A, B>(outer: Prism<S, A>, inner: Prism<A, B>): Prism<S, B>
function compose<S, A, B>(
  outer: Lens<S, A> | Prism<S, A>,
  inner: Lens<A, B> | Prism<A, B>,
): Lens<S, B> | Prism<S, B> {
  // Lens ∘ Lens => Lens
  if (outer._tag === 'lens' && inner._tag === 'lens') {
    return makeLens(
      (s: S) => inner.get(outer.get(s)),
      (b: B | ((b: B) => B)) =>
        <T extends S>(s: T) => {
          const newA = inner.set(b)(outer.get(s))
          return outer.set(newA)(s)
        },
    )
  }

  // Otherwise, return a Prism
  return makePrism<S, B>({
    get: (s: S) => {
      const outerValue = outer.get(s as S)
      if (outerValue === undefined) return undefined
      // inner could be lens or prism
      // lens.get returns B, prism.get returns B | undefined
      return (inner as Lens<A, B> | Prism<A, B>).get(outerValue as A)
    },
    set:
      (b: B | ((b: B) => B)) =>
      <T extends S>(s: T) => {
        const outerValue = outer.get(s as S)
        if (outerValue === undefined) return s
        const newOuterValue = (inner as Lens<A, B> | Prism<A, B>).set(b)(outerValue as A)
        return outer.set(newOuterValue as A)(s as T)
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
  function composeForLens<A, B>(
    outer: Lens<S, A>,
    inner: Lens<A, B> | Prism<A, B>,
  ): Lens<S, B> | Prism<S, B> {
    /**
     * Yes this weird ternary is necessary for the function overloads to
     * resolve correctly.
     */
    return inner._tag === 'lens' ? compose(outer, inner) : compose(outer, inner)
  }

  return {
    /** Creates a lens for a specific property of the source type */
    prop: <K extends keyof S>(key: K) => prop<S, K>(key),
    /** Composes this lens with another lens or prism */
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
  function composeForPrism<A, B>(outer: Prism<S, A>, inner: Lens<A, B> | Prism<A, B>): Prism<S, B> {
    return inner._tag === 'lens' ? compose(outer, inner) : compose(outer, inner)
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
    /** Composes this prism with another lens or prism */
    compose: composeForPrism,
  }
}

export const Lens = createLens
export const Prism = createPrism
