import { describe, expect, it } from 'vitest'
import { Getter } from '../src'

describe('Getter', () => {
  type Person = { firstName: string; lastName: string; age: number }

  const fullName = Getter<Person, string>((p) => `${p.firstName} ${p.lastName}`)

  it('extracts a computed value', () => {
    expect(fullName.get({ firstName: 'Alice', lastName: 'Smith', age: 30 })).toBe('Alice Smith')
  })

  it('is tagged as getter', () => {
    expect(fullName._tag).toBe('getter')
  })

  it('has no set method', () => {
    expect('set' in fullName).toBe(false)
  })

  it('works with derived numeric values', () => {
    type Rect = { width: number; height: number }
    const area = Getter<Rect, number>((r) => r.width * r.height)
    expect(area.get({ width: 3, height: 4 })).toBe(12)
  })
})
