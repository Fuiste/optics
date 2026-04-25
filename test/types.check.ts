/* eslint-disable @typescript-eslint/no-unused-vars */

import { Fold, Getter, Iso, Lens, Prism, Traversal, compose, each, guard, index } from '../src'
import type { InferSource, InferTarget } from '../src'

type Assert<T extends true> = T
type IsEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type TagOf<T> = T extends { _tag: infer Tag } ? Tag : never

type Inner = { value: number; maybe?: number; list: number[] }
type Box = { inner: Inner; maybeInner?: Inner; inners: Inner[] }

const outerLens = Lens<Box>().prop('inner')
const outerPrism = Prism<Box>().of({
  get: (box) => box.maybeInner,
  set: (inner) => (box) => ({ ...box, maybeInner: inner }),
})
const outerIso = Iso<Box, Inner>({
  to: (box) => box.inner,
  from: (inner) => ({ inner, maybeInner: inner, inners: [inner] }),
})
const outerTraversal = Traversal<Box, Inner>({
  getAll: (box) => box.inners,
  modify: (f) => (box) => ({ ...box, inners: box.inners.map(f) }),
})
const outerGetter = Getter<Box, Inner>((box) => box.inner)
const outerFold = Fold<Box, Inner>((box) => box.inners)

const innerLens = Lens<Inner>().prop('value')
const innerPrism = Prism<Inner>().of({
  get: (inner) => inner.maybe,
  set: (maybe) => (inner) => ({ ...inner, maybe }),
})
const innerIso = Iso<Inner, number>({
  to: (inner) => inner.value,
  from: (value) => ({ value, maybe: value, list: [value] }),
})
const innerTraversal = Traversal<Inner, number>({
  getAll: (inner) => inner.list,
  modify: (f) => (inner) => ({ ...inner, list: inner.list.map(f) }),
})
const innerGetter = Getter<Inner, number>((inner) => inner.value)
const innerFold = Fold<Inner, number>((inner) => inner.list)

const composedLensLens = compose(outerLens, innerLens)
const composedLensPrism = compose(outerLens, innerPrism)
const composedLensIso = compose(outerLens, innerIso)
const composedLensTraversal = compose(outerLens, innerTraversal)
const composedLensGetter = compose(outerLens, innerGetter)
const composedLensFold = compose(outerLens, innerFold)

const composedPrismLens = compose(outerPrism, innerLens)
const composedPrismPrism = compose(outerPrism, innerPrism)
const composedPrismIso = compose(outerPrism, innerIso)
const composedPrismTraversal = compose(outerPrism, innerTraversal)
const composedPrismGetter = compose(outerPrism, innerGetter)
const composedPrismFold = compose(outerPrism, innerFold)

const composedIsoLens = compose(outerIso, innerLens)
const composedIsoPrism = compose(outerIso, innerPrism)
const composedIsoIso = compose(outerIso, innerIso)
const composedIsoTraversal = compose(outerIso, innerTraversal)
const composedIsoGetter = compose(outerIso, innerGetter)
const composedIsoFold = compose(outerIso, innerFold)

const composedTraversalLens = compose(outerTraversal, innerLens)
const composedTraversalPrism = compose(outerTraversal, innerPrism)
const composedTraversalIso = compose(outerTraversal, innerIso)
const composedTraversalTraversal = compose(outerTraversal, innerTraversal)
const composedTraversalGetter = compose(outerTraversal, innerGetter)
const composedTraversalFold = compose(outerTraversal, innerFold)

const composedGetterLens = compose(outerGetter, innerLens)
const composedGetterPrism = compose(outerGetter, innerPrism)
const composedGetterIso = compose(outerGetter, innerIso)
const composedGetterTraversal = compose(outerGetter, innerTraversal)
const composedGetterGetter = compose(outerGetter, innerGetter)
const composedGetterFold = compose(outerGetter, innerFold)

const composedFoldLens = compose(outerFold, innerLens)
const composedFoldPrism = compose(outerFold, innerPrism)
const composedFoldIso = compose(outerFold, innerIso)
const composedFoldTraversal = compose(outerFold, innerTraversal)
const composedFoldGetter = compose(outerFold, innerGetter)
const composedFoldFold = compose(outerFold, innerFold)

type _InferSource = Assert<IsEqual<InferSource<typeof outerLens>, Box>>
type _InferTarget = Assert<IsEqual<InferTarget<typeof innerLens>, number>>
type _IndexTag = Assert<IsEqual<TagOf<ReturnType<typeof index<number>>>, 'prism'>>
type _EachTag = Assert<IsEqual<TagOf<ReturnType<typeof each<number>>>, 'traversal'>>

type _LensLens = Assert<IsEqual<TagOf<typeof composedLensLens>, 'lens'>>
type _LensPrism = Assert<IsEqual<TagOf<typeof composedLensPrism>, 'prism'>>
type _LensIso = Assert<IsEqual<TagOf<typeof composedLensIso>, 'lens'>>
type _LensTraversal = Assert<IsEqual<TagOf<typeof composedLensTraversal>, 'traversal'>>
type _LensGetter = Assert<IsEqual<TagOf<typeof composedLensGetter>, 'getter'>>
type _LensFold = Assert<IsEqual<TagOf<typeof composedLensFold>, 'fold'>>

type _PrismLens = Assert<IsEqual<TagOf<typeof composedPrismLens>, 'prism'>>
type _PrismPrism = Assert<IsEqual<TagOf<typeof composedPrismPrism>, 'prism'>>
type _PrismIso = Assert<IsEqual<TagOf<typeof composedPrismIso>, 'prism'>>
type _PrismTraversal = Assert<IsEqual<TagOf<typeof composedPrismTraversal>, 'traversal'>>
type _PrismGetter = Assert<IsEqual<TagOf<typeof composedPrismGetter>, 'fold'>>
type _PrismFold = Assert<IsEqual<TagOf<typeof composedPrismFold>, 'fold'>>

type _IsoLens = Assert<IsEqual<TagOf<typeof composedIsoLens>, 'lens'>>
type _IsoPrism = Assert<IsEqual<TagOf<typeof composedIsoPrism>, 'prism'>>
type _IsoIso = Assert<IsEqual<TagOf<typeof composedIsoIso>, 'iso'>>
type _IsoTraversal = Assert<IsEqual<TagOf<typeof composedIsoTraversal>, 'traversal'>>
type _IsoGetter = Assert<IsEqual<TagOf<typeof composedIsoGetter>, 'getter'>>
type _IsoFold = Assert<IsEqual<TagOf<typeof composedIsoFold>, 'fold'>>

type _TraversalLens = Assert<IsEqual<TagOf<typeof composedTraversalLens>, 'traversal'>>
type _TraversalPrism = Assert<IsEqual<TagOf<typeof composedTraversalPrism>, 'traversal'>>
type _TraversalIso = Assert<IsEqual<TagOf<typeof composedTraversalIso>, 'traversal'>>
type _TraversalTraversal = Assert<IsEqual<TagOf<typeof composedTraversalTraversal>, 'traversal'>>
type _TraversalGetter = Assert<IsEqual<TagOf<typeof composedTraversalGetter>, 'fold'>>
type _TraversalFold = Assert<IsEqual<TagOf<typeof composedTraversalFold>, 'fold'>>

type _GetterLens = Assert<IsEqual<TagOf<typeof composedGetterLens>, 'getter'>>
type _GetterPrism = Assert<IsEqual<TagOf<typeof composedGetterPrism>, 'fold'>>
type _GetterIso = Assert<IsEqual<TagOf<typeof composedGetterIso>, 'getter'>>
type _GetterTraversal = Assert<IsEqual<TagOf<typeof composedGetterTraversal>, 'fold'>>
type _GetterGetter = Assert<IsEqual<TagOf<typeof composedGetterGetter>, 'getter'>>
type _GetterFold = Assert<IsEqual<TagOf<typeof composedGetterFold>, 'fold'>>

type _FoldLens = Assert<IsEqual<TagOf<typeof composedFoldLens>, 'fold'>>
type _FoldPrism = Assert<IsEqual<TagOf<typeof composedFoldPrism>, 'fold'>>
type _FoldIso = Assert<IsEqual<TagOf<typeof composedFoldIso>, 'fold'>>
type _FoldTraversal = Assert<IsEqual<TagOf<typeof composedFoldTraversal>, 'fold'>>
type _FoldGetter = Assert<IsEqual<TagOf<typeof composedFoldGetter>, 'fold'>>
type _FoldFold = Assert<IsEqual<TagOf<typeof composedFoldFold>, 'fold'>>

type Person = { name: string; age: number }
const lens = Lens<Person>()
const ageLens = lens.prop('age')
ageLens.set(30)({ name: 'Ada', age: 29 })

// @ts-expect-error invalid property key
lens.prop('invalid')

// @ts-expect-error wrong setter input type
ageLens.set('thirty')({ name: 'Ada', age: 29 })

type Circle = { type: 'circle'; radius: number }
type Square = { type: 'square'; side: number }
type Shape = Circle | Square

const circlePrism = guard<Shape, Circle>((shape): shape is Circle => shape.type === 'circle')
const updatedShape = circlePrism.set({ type: 'circle', radius: 1 })({ type: 'square', side: 4 })
updatedShape.side.toFixed()
