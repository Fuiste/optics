import { describe, expect, it } from 'vitest'
import { guard, at, each, index } from '../src'

describe('guard', () => {
  type Circle = { type: 'circle'; radius: number }
  type Square = { type: 'square'; side: number }
  type Shape = Circle | Square

  const circlePrism = guard<Shape, Circle>((s): s is Circle => s.type === 'circle')

  it('gets the matching branch', () => {
    expect(circlePrism.get({ type: 'circle', radius: 5 })).toMatchInlineSnapshot(`
      {
        "radius": 5,
        "type": "circle",
      }
    `)
  })

  it('returns undefined for non-matching branch', () => {
    expect(circlePrism.get({ type: 'square', side: 10 })).toBeUndefined()
  })

  it('sets a concrete value', () => {
    const updated = circlePrism.set({ type: 'circle', radius: 99 })({ type: 'circle', radius: 5 })
    expect(updated).toMatchInlineSnapshot(`
      {
        "radius": 99,
        "type": "circle",
      }
    `)
  })

  it('can replace a non-matching branch with a matching one', () => {
    const updated = circlePrism.set({ type: 'circle', radius: 99 })({ type: 'square', side: 4 })
    expect(updated).toMatchInlineSnapshot(`
      {
        "radius": 99,
        "type": "circle",
      }
    `)
  })

  it('sets via function updater on matching branch', () => {
    const updated = circlePrism.set((c) => ({ ...c, radius: c.radius * 2 }))({
      type: 'circle',
      radius: 5,
    })
    expect(updated).toMatchInlineSnapshot(`
      {
        "radius": 10,
        "type": "circle",
      }
    `)
  })

  it('no-ops function updater on non-matching branch', () => {
    const square: Shape = { type: 'square', side: 4 }
    const updated = circlePrism.set((c) => ({ ...c, radius: c.radius * 2 }))(square)
    expect(updated).toBe(square)
  })

  it('is tagged as prism', () => {
    expect(circlePrism._tag).toBe('prism')
  })
})

describe('at', () => {
  const authHeader = at<string>('Authorization')

  it('gets a present key', () => {
    expect(authHeader.get({ Authorization: 'Bearer x' })).toBe('Bearer x')
  })

  it('returns undefined for a missing key', () => {
    expect(authHeader.get({})).toBeUndefined()
  })

  it('sets a concrete value (upsert)', () => {
    const updated = authHeader.set('Bearer y')({})
    expect(updated).toMatchInlineSnapshot(`
      {
        "Authorization": "Bearer y",
      }
    `)
  })

  it('updates an existing value with function updater', () => {
    const updated = authHeader.set((v) => v.toUpperCase())({ Authorization: 'Bearer x' })
    expect(updated).toMatchInlineSnapshot(`
      {
        "Authorization": "BEARER X",
      }
    `)
  })

  it('no-ops function updater when key is absent', () => {
    const original = { 'Content-Type': 'json' }
    const updated = authHeader.set((v) => v.toUpperCase())(original)
    expect(updated).toBe(original)
  })

  it('is tagged as prism', () => {
    expect(authHeader._tag).toBe('prism')
  })
})

describe('each', () => {
  const nums = each<number>()

  it('getAll returns all elements', () => {
    expect(nums.getAll([1, 2, 3])).toMatchInlineSnapshot(`
      [
        1,
        2,
        3,
      ]
    `)
  })

  it('getAll on empty array returns empty', () => {
    expect(nums.getAll([])).toMatchInlineSnapshot(`[]`)
  })

  it('modify applies function to each element', () => {
    expect(nums.modify((n) => n * 2)([1, 2, 3])).toMatchInlineSnapshot(`
      [
        2,
        4,
        6,
      ]
    `)
  })

  it('returns the original reference when nothing changes', () => {
    const values = [1, 2, 3]
    expect(nums.modify((n) => n)(values)).toBe(values)
  })

  it('is tagged as traversal', () => {
    expect(nums._tag).toBe('traversal')
  })
})

describe('index', () => {
  const second = index<number>(1)

  it('gets a present element', () => {
    expect(second.get([1, 2, 3])).toBe(2)
  })

  it('returns undefined when out of bounds', () => {
    expect(index<number>(5).get([1, 2, 3])).toBeUndefined()
  })

  it('sets a present element immutably', () => {
    const values = [1, 2, 3]
    const updated = second.set(20)(values)

    expect(updated).toMatchInlineSnapshot(`
      [
        1,
        20,
        3,
      ]
    `)
    expect(updated).not.toBe(values)
  })

  it('no-ops set when out of bounds', () => {
    const values = [1, 2, 3]
    expect(index<number>(5).set(20)(values)).toBe(values)
  })

  it('returns the original reference for unchanged updates', () => {
    const values = [1, 2, 3]
    expect(second.set(2)(values)).toBe(values)
    expect(second.set((value) => value)(values)).toBe(values)
  })

  it('is tagged as prism', () => {
    expect(second._tag).toBe('prism')
  })
})
