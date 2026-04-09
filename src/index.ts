// ── Types ─────────────────────────────────────────────────────────────
import type {
  Lens as _Lens,
  Prism as _Prism,
  Iso as _Iso,
  Traversal as _Traversal,
  Getter as _Getter,
  Fold as _Fold,
} from './types.js'

export type { Optic, InferSource, InferTarget } from './types.js'

export type Lens<S, A> = _Lens<S, A>
export type Prism<S, A> = _Prism<S, A>
export type Iso<S, A> = _Iso<S, A>
export type Traversal<S, A> = _Traversal<S, A>
export type Getter<S, A> = _Getter<S, A>
export type Fold<S, A> = _Fold<S, A>

// ── Factories ─────────────────────────────────────────────────────────
import { createLens } from './lens.js'
import { createPrism } from './prism.js'
import { makeIso } from './iso.js'
import { makeTraversal } from './traversal.js'
import { makeGetter } from './getter.js'
import { makeFold } from './fold.js'

export const Lens = createLens
export const Prism = createPrism
export const Iso = makeIso
export const Traversal = makeTraversal
export const Getter = makeGetter
export const Fold = makeFold

// ── Composition ───────────────────────────────────────────────────────
export { compose } from './compose.js'

// ── Combinators ───────────────────────────────────────────────────────
export { guard, at, each, index } from './combinators.js'
