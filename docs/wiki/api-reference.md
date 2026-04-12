# API Reference

Public exports from `src/index.ts`:

## `Lens`
- Type: `type Lens<S, A> = { _tag: 'lens'; get: (s: S) => A; set: (a: A | ((a: A) => A)) => <T extends S>(s: T) => T }`
- Factory: `Lens<S>(): { prop: <K extends keyof S>(key: K) => Lens<S, S[K]> }`

## `Prism`
- Type: `type Prism<S, A> = { _tag: 'prism'; get: (s: S) => A | undefined; set: (a: A | ((a: A) => A)) => <T extends S>(s: T) => T }`
- Factory: `Prism<S>(): { of: <A>(prism: { get: (s: S) => A | undefined; set: (a: A) => (s: S) => S }) => Prism<S, A> }`

## `Iso`
- Type: `type Iso<S, A> = { _tag: 'iso'; to: (s: S) => A; from: (a: A) => S }`
- Factory: `Iso<S, A>(iso: { to: (s: S) => A; from: (a: A) => S }): Iso<S, A>`

## `Traversal`
- Type: `type Traversal<S, A> = { _tag: 'traversal'; getAll: (s: S) => ReadonlyArray<A>; modify: (f: (a: A) => A) => <T extends S>(s: T) => T }`
- Factory: `Traversal<S, A>(traversal: { getAll: (s: S) => ReadonlyArray<A>; modify: (f: (a: A) => A) => <T extends S>(s: T) => T }): Traversal<S, A>`

## `Getter`
- Type: `type Getter<S, A> = { _tag: 'getter'; get: (s: S) => A }`
- Factory: `Getter<S, A>(get: (s: S) => A): Getter<S, A>`

## `Fold`
- Type: `type Fold<S, A> = { _tag: 'fold'; getAll: (s: S) => ReadonlyArray<A> }`
- Factory: `Fold<S, A>(getAll: (s: S) => ReadonlyArray<A>): Fold<S, A>`

## `compose`
- Signature: overloaded composition helper
- Examples:  
  - `compose<S, A, B>(outer: Lens<S, A>, inner: Lens<A, B>): Lens<S, B>`
  - `compose<S, A, B>(outer: Fold<S, A>, inner: Fold<A, B>): Fold<S, B>`
  - `compose(outer: Optic, inner: Optic): Optic`

## `guard`
- Signature: `guard<S, A extends S>(predicate: (s: S) => s is A): Prism<S, A>`

## `at`
- Signature: `at<V>(key: string): Prism<Readonly<Record<string, V>>, V>`

## `index`
- Signature: `index<A>(idx: number): Prism<ReadonlyArray<A>, A>`

## `each`
- Signature: `each<A>(): Traversal<ReadonlyArray<A>, A>`

## `Optic`
- Type alias: `type Optic<S = any, A = any> = Lens<S, A> | Prism<S, A> | Iso<S, A> | Traversal<S, A> | Getter<S, A> | Fold<S, A>`

## `InferSource`
- Type alias: `type InferSource<O extends Optic> = O extends Lens<infer S, any> ? S : O extends Prism<infer S, any> ? S : O extends Iso<infer S, any> ? S : O extends Traversal<infer S, any> ? S : O extends Getter<infer S, any> ? S : O extends Fold<infer S, any> ? S : never`

## `InferTarget`
- Type alias: `type InferTarget<O extends Optic> = O extends Lens<any, infer A> ? A : O extends Prism<any, infer A> ? A : O extends Iso<any, infer A> ? A : O extends Traversal<any, infer A> ? A : O extends Getter<any, infer A> ? A : O extends Fold<any, infer A> ? A : never`
