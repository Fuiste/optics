# README → Wiki API Alignment Map

## Source of truth
- Root file scanned: `README.md`
- Scope: public API surface, terminology, import style, example form, and behavior notes
- Constraint: do not introduce wiki references for modules/functions/features not present in this README

## Reusable optics vocabulary (keep these names/meaning)
- `Lens` — total focus on required value
- `Prism` — partial focus on optional/union value
- `Iso` — total invertible mapping between two types
- `Traversal` — focuses zero or more values
- `Getter` — read-only total focus
- `Fold` — read-only multi-focus extraction
- `Optic` — union type of all optic kinds (from API reference)

## Reusable factories and constructors
- `Lens<S>().prop<K extends keyof S>(key: K): Lens<S, S[K]>`
- `Prism<S>().of<A>({ get, set }): Prism<S, A>`
- `Iso<S, A>({ to, from }): Iso<S, A>`
- `Traversal<S, A>({ getAll, modify }): Traversal<S, A>`
- `Getter<S, A>(get: (s: S) => A): Getter<S, A>`
- `Fold<S, A>(getAll: (s: S) => ReadonlyArray<A>): Fold<S, A>`

## Reusable standalone functions
- `compose(outer, inner): Optic` with 36 overloads (type inferred)
- `guard<S, A extends S>(predicate: (s: S) => s is A): Prism<S, A>`
- `at<V>(key: string): Prism<Record<string, V>, V>`
- `index<A>(idx: number): Prism<ReadonlyArray<A>, A>`
- `each<A>(): Traversal<ReadonlyArray<A>, A>`

## Import/call patterns to mirror
- Canonical package import: `import { Lens, ... } from '@fuiste/optics'`
- Each quick-start section in README imports only the needed symbols.
- Keep composition style: `compose(outerOptic, innerOptic)` and assign to descriptive constants.
- Setter/getter usage examples should reuse:
  - `optic.get(value)` for reads
  - `optic.set(next)(source)` for writes/updates
  - `optic.modify(fn)(source)` for traversals
  - `optic.getAll(value)` for multi-focus reads
- Example tone: concise comments, small domain types, direct inline comments for edge-case behavior (`// unchanged`, `=>` examples for no-op/missing path).

## API reference anchors to reuse (types and signatures)
- Types in README API section:
  - `type Lens<S, A> = { _tag: 'lens', get, set }`
  - `type Prism<S, A> = { _tag: 'prism', get, set }`
  - `type Iso<S, A> = { _tag: 'iso', to, from }`
  - `type Traversal<S, A> = { _tag: 'traversal', getAll, modify }`
  - `type Getter<S, A> = { _tag: 'getter', get }`
  - `type Fold<S, A> = { _tag: 'fold', getAll }`
  - `type Optic<S, A> = Lens | Prism | Iso | Traversal | Getter | Fold`
- Utility types in README API section:
  - `InferSource<O extends Optic>`
  - `InferTarget<O extends Optic>`

## Behavior notes to reuse verbatim in docs
- `Lens#set` and `Prism#set` accept a value or updater function and return a new object (no mutation)
- `Prism#get` may return `undefined`; composed prisms propagate missing-branch `undefined`
- `Prism#set` through missing branch is a no-op by default
- `Prism ∘ Iso` exception: concrete set can materialize missing outer via outer prism
- `Traversal#modify` applies function to every element and becomes no-op through missing prism branch
- `Getter`/`Fold` are read-only and produce read-only composed results
- unchanged updates preserve reference identity where focus unchanged

## Practical wiki section reuse plan
- Wiki section order should mirror README major structure:
  1. Overview (core optics names)
  2. Installation
  3. Quick start by optic kind (Lens, Prism, Iso, Traversal, Getter, Fold)
  4. Composition (matrix + rules + chain examples)
  5. Combinators (`guard`, `at`, `index`, `each`)
  6. API reference (types/factories/functions/utility types)
  7. Behaviour notes
  8. Best practices
- Narrative policy:
  - New section prose should explain intent; examples should reuse one of the README snippets as-is or minimally adapted naming.
  - Avoid repeating API semantics verbatim across multiple sections; if semantics already covered under composition or API reference, link internally.
  - Do not introduce API modules/features not explicitly covered in README.
