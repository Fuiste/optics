import { describe, expect, it } from 'vitest'
import { Fold } from '../src'

describe('Fold', () => {
  const words = Fold<string, string>((s) => s.split(' '))

  it('extracts multiple values', () => {
    expect(words.getAll('hello world foo')).toMatchInlineSnapshot(`
      [
        "hello",
        "world",
        "foo",
      ]
    `)
  })

  it('returns empty for empty input', () => {
    expect(words.getAll('')).toMatchInlineSnapshot(`
      [
        "",
      ]
    `)
  })

  it('is tagged as fold', () => {
    expect(words._tag).toBe('fold')
  })

  it('has no modify method', () => {
    expect('modify' in words).toBe(false)
  })
})
