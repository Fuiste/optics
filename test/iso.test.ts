import { describe, expect, it } from 'vitest'
import { Iso } from '../src'

describe('Iso', () => {
  const numberString = Iso<number, string>({
    to: (n) => `${n}`,
    from: (s) => parseInt(s, 10),
  })

  it('converts forward with to', () => {
    expect(numberString.to(42)).toBe('42')
  })

  it('converts backward with from', () => {
    expect(numberString.from('123')).toBe(123)
  })

  it('round-trips: from(to(s)) === s', () => {
    expect(numberString.from(numberString.to(7))).toBe(7)
  })

  it('round-trips: to(from(a)) === a', () => {
    expect(numberString.to(numberString.from('99'))).toBe('99')
  })

  it('is tagged as iso', () => {
    expect(numberString._tag).toBe('iso')
  })

  it('works with complex types', () => {
    type Celsius = { celsius: number }
    type Fahrenheit = { fahrenheit: number }
    const tempIso = Iso<Celsius, Fahrenheit>({
      to: (c) => ({ fahrenheit: c.celsius * 9 / 5 + 32 }),
      from: (f) => ({ celsius: (f.fahrenheit - 32) * 5 / 9 }),
    })
    expect(tempIso.to({ celsius: 100 })).toMatchInlineSnapshot(`
      {
        "fahrenheit": 212,
      }
    `)
    expect(tempIso.from({ fahrenheit: 32 })).toMatchInlineSnapshot(`
      {
        "celsius": 0,
      }
    `)
  })
})
