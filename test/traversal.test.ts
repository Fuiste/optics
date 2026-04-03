import { describe, expect, it } from 'vitest'
import { Traversal } from '../src'

describe('Traversal', () => {
  const doubleEvens = Traversal<number[], number>({
    getAll: (ns) => ns.filter((n) => n % 2 === 0),
    modify:
      (f) =>
      <T extends number[]>(ns: T) =>
        ns.map((n) => (n % 2 === 0 ? f(n) : n)) as unknown as T,
  })

  it('getAll extracts focused values', () => {
    expect(doubleEvens.getAll([1, 2, 3, 4, 5])).toMatchInlineSnapshot(`
      [
        2,
        4,
      ]
    `)
  })

  it('modify applies a function to each focused value', () => {
    expect(doubleEvens.modify((n) => n * 10)([1, 2, 3, 4, 5])).toMatchInlineSnapshot(`
      [
        1,
        20,
        3,
        40,
        5,
      ]
    `)
  })

  it('getAll on empty input returns empty', () => {
    expect(doubleEvens.getAll([])).toMatchInlineSnapshot(`[]`)
  })

  it('modify on empty input returns empty', () => {
    expect(doubleEvens.modify((n) => n + 1)([])).toMatchInlineSnapshot(`[]`)
  })

  it('is tagged as traversal', () => {
    expect(doubleEvens._tag).toBe('traversal')
  })
})
