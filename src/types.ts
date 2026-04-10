/**
 * A functional lens that provides total, immutable access to a value `A` inside a structure `S`.
 * `get` always succeeds; `set` accepts a value or updater function.
 */
export type Lens<S, A> = {
  readonly _tag: 'lens'
  readonly get: (s: S) => A
  readonly set: (a: A | ((a: A) => A)) => <T extends S>(s: T) => T
}

/**
 * A functional prism that provides partial, immutable access to a value `A` inside `S`.
 * `get` may return `undefined` (e.g. optional fields, union branches).
 * `set` with a function updater is a no-op when `get` returns `undefined`.
 */
export type Prism<S, A> = {
  readonly _tag: 'prism'
  readonly get: (s: S) => A | undefined
  readonly set: (a: A | ((a: A) => A)) => <T extends S>(s: T) => T
}

/**
 * A total, invertible mapping (isomorphism) between two types.
 * `to` and `from` must be inverses: `from(to(s)) === s` and `to(from(a)) === a`.
 */
export type Iso<S, A> = {
  readonly _tag: 'iso'
  readonly to: (s: S) => A
  readonly from: (a: A) => S
}

/**
 * A traversal focuses on zero or more values of type `A` inside a structure `S`.
 * `getAll` extracts all focused values; `modify` applies a function to each.
 */
export type Traversal<S, A> = {
  readonly _tag: 'traversal'
  readonly getAll: (s: S) => ReadonlyArray<A>
  readonly modify: (f: (a: A) => A) => <T extends S>(s: T) => T
}

/**
 * A read-only optic that extracts exactly one value of type `A` from `S`.
 * Like a Lens without `set`.
 */
export type Getter<S, A> = {
  readonly _tag: 'getter'
  readonly get: (s: S) => A
}

/**
 * A read-only optic that extracts zero or more values of type `A` from `S`.
 * Like a Traversal without `modify`.
 */
export type Fold<S, A> = {
  readonly _tag: 'fold'
  readonly getAll: (s: S) => ReadonlyArray<A>
}

/** Union of all optic types. */
export type Optic<S = any, A = any> =
  | Lens<S, A>
  | Prism<S, A>
  | Iso<S, A>
  | Traversal<S, A>
  | Getter<S, A>
  | Fold<S, A>

/** Extracts the source type `S` from any optic. */
export type InferSource<O extends Optic> =
  O extends Lens<infer S, any>
    ? S
    : O extends Prism<infer S, any>
      ? S
      : O extends Iso<infer S, any>
        ? S
        : O extends Traversal<infer S, any>
          ? S
          : O extends Getter<infer S, any>
            ? S
            : O extends Fold<infer S, any>
              ? S
              : never

/** Extracts the target type `A` from any optic. */
export type InferTarget<O extends Optic> =
  O extends Lens<any, infer A>
    ? A
    : O extends Prism<any, infer A>
      ? A
      : O extends Iso<any, infer A>
        ? A
        : O extends Traversal<any, infer A>
          ? A
          : O extends Getter<any, infer A>
            ? A
            : O extends Fold<any, infer A>
              ? A
              : never
