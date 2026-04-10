import { describe, expect, it } from 'vitest'
import { Fold, Getter, Iso, Lens, Prism, Traversal, compose } from '../src'

type Inner = { value: number; maybe?: number; list: number[] }
type Box = { inner: Inner; maybeInner?: Inner; inners: Inner[] }

const sampleInner: Inner = { value: 1, maybe: 2, list: [1, 2, 3] }

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

describe('compose result matrix', () => {
  it.each([
    ['Lens ∘ Lens', compose(outerLens, innerLens), 'lens'],
    ['Lens ∘ Prism', compose(outerLens, innerPrism), 'prism'],
    ['Lens ∘ Iso', compose(outerLens, innerIso), 'lens'],
    ['Lens ∘ Traversal', compose(outerLens, innerTraversal), 'traversal'],
    ['Lens ∘ Getter', compose(outerLens, innerGetter), 'getter'],
    ['Lens ∘ Fold', compose(outerLens, innerFold), 'fold'],
    ['Prism ∘ Lens', compose(outerPrism, innerLens), 'prism'],
    ['Prism ∘ Prism', compose(outerPrism, innerPrism), 'prism'],
    ['Prism ∘ Iso', compose(outerPrism, innerIso), 'prism'],
    ['Prism ∘ Traversal', compose(outerPrism, innerTraversal), 'traversal'],
    ['Prism ∘ Getter', compose(outerPrism, innerGetter), 'fold'],
    ['Prism ∘ Fold', compose(outerPrism, innerFold), 'fold'],
    ['Iso ∘ Lens', compose(outerIso, innerLens), 'lens'],
    ['Iso ∘ Prism', compose(outerIso, innerPrism), 'prism'],
    ['Iso ∘ Iso', compose(outerIso, innerIso), 'iso'],
    ['Iso ∘ Traversal', compose(outerIso, innerTraversal), 'traversal'],
    ['Iso ∘ Getter', compose(outerIso, innerGetter), 'getter'],
    ['Iso ∘ Fold', compose(outerIso, innerFold), 'fold'],
    ['Traversal ∘ Lens', compose(outerTraversal, innerLens), 'traversal'],
    ['Traversal ∘ Prism', compose(outerTraversal, innerPrism), 'traversal'],
    ['Traversal ∘ Iso', compose(outerTraversal, innerIso), 'traversal'],
    ['Traversal ∘ Traversal', compose(outerTraversal, innerTraversal), 'traversal'],
    ['Traversal ∘ Getter', compose(outerTraversal, innerGetter), 'fold'],
    ['Traversal ∘ Fold', compose(outerTraversal, innerFold), 'fold'],
    ['Getter ∘ Lens', compose(outerGetter, innerLens), 'getter'],
    ['Getter ∘ Prism', compose(outerGetter, innerPrism), 'fold'],
    ['Getter ∘ Iso', compose(outerGetter, innerIso), 'getter'],
    ['Getter ∘ Traversal', compose(outerGetter, innerTraversal), 'fold'],
    ['Getter ∘ Getter', compose(outerGetter, innerGetter), 'getter'],
    ['Getter ∘ Fold', compose(outerGetter, innerFold), 'fold'],
    ['Fold ∘ Lens', compose(outerFold, innerLens), 'fold'],
    ['Fold ∘ Prism', compose(outerFold, innerPrism), 'fold'],
    ['Fold ∘ Iso', compose(outerFold, innerIso), 'fold'],
    ['Fold ∘ Traversal', compose(outerFold, innerTraversal), 'fold'],
    ['Fold ∘ Getter', compose(outerFold, innerGetter), 'fold'],
    ['Fold ∘ Fold', compose(outerFold, innerFold), 'fold'],
  ])('%s has the expected tag', (_name, optic, expectedTag) => {
    expect(optic._tag).toBe(expectedTag)
  })

  it('still executes representative composed optics', () => {
    const box: Box = { inner: sampleInner, maybeInner: sampleInner, inners: [sampleInner] }

    expect(compose(outerLens, innerTraversal).getAll(box)).toEqual([1, 2, 3])
    expect(compose(outerPrism, innerLens).get(box)).toBe(1)
    expect(compose(outerFold, innerFold).getAll(box)).toEqual([1, 2, 3])
  })
})
