import { describe, expect, it } from 'vitest'
import { EffectIso, EffectLens, EffectPrism } from '../src'
import { Either } from 'effect'

describe('EffectLens', () => {
  it('get/set succeed', () => {
    type Person = { name: string; age: number }
    const nameL = EffectLens<Person>().prop('name')

    const p: Person = { name: 'John', age: 30 }
    const get = nameL.get(p)
    expect(Either.isRight(get)).toBe(true)
    if (Either.isRight(get)) expect(get.right).toBe('John')

    const set = nameL.set('Jane')(p)
    expect(Either.isRight(set)).toBe(true)
    if (Either.isRight(set)) expect(set.right).toEqual({ name: 'Jane', age: 30 })
  })
})

describe('EffectIso', () => {
  it('to/from succeed', () => {
    const numStr = EffectIso<number, string>({ to: (n) => `${n}`, from: (s) => parseInt(s, 10) })
    const to = numStr.to(7)
    expect(Either.isRight(to)).toBe(true)
    if (Either.isRight(to)) expect(to.right).toBe('7')

    const from = numStr.from('10')
    expect(Either.isRight(from)).toBe(true)
    if (Either.isRight(from)) expect(from.right).toBe(10)
  })
})

describe('EffectPrism', () => {
  type Address = { street: string; city: string }
  type Person = { name: string; address?: Address }

  const addressP = EffectPrism<Person>().of({
    get: (p) => p.address,
    set: (address) => (p) => ({ ...p, address }),
  })
  const cityL = EffectLens<Address>().prop('city')

  it('get success/failure', () => {
    const got1 = addressP.get({ name: 'A', address: { street: '1', city: 'NYC' } })
    expect(Either.isRight(got1)).toBe(true)

    const got2 = addressP.get({ name: 'A' })
    expect(Either.isLeft(got2)).toBe(true)
  })

  it('set success/failure', () => {
    const res1 = addressP.set({ street: '2', city: 'LA' })({ name: 'A' })
    expect(Either.isRight(res1)).toBe(true)

    const composed = EffectPrism<Person>().compose(addressP, cityL)
    const res2 = composed.set('LA')({ name: 'A' })
    expect(Either.isLeft(res2)).toBe(true)
  })
})

describe('Effect composition', () => {
  it('Prism ∘ Lens works', () => {
    type Address = { street: string; city: string }
    type Person = { name: string; address?: Address }
    const address = EffectPrism<Person>().of({ get: (p) => p.address, set: (a) => (p) => ({ ...p, address: a }) })
    const city = EffectLens<Address>().prop('city')
    const composed = EffectPrism<Person>().compose(address, city)

    const ok = composed.get({ name: 'A', address: { street: '1', city: 'NYC' } })
    expect(Either.isRight(ok)).toBe(true)
    const bad = composed.get({ name: 'A' })
    expect(Either.isLeft(bad)).toBe(true)
  })
})


