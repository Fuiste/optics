import { describe, expect, it } from 'vitest'
import { EffectIso, EffectLens, EffectPrism } from '../src'
import { Exit } from 'effect'

describe('EffectLens', () => {
  it('get/set succeed', () => {
    type Person = { name: string; age: number }
    const nameL = EffectLens<Person>().prop('name')

    const p: Person = { name: 'John', age: 30 }
    const get = nameL.get(p)
    expect(Exit.isSuccess(get)).toBe(true)
    if (Exit.isSuccess(get)) expect(get.value).toBe('John')

    const set = nameL.set('Jane')(p)
    expect(Exit.isSuccess(set)).toBe(true)
    if (Exit.isSuccess(set)) expect(set.value).toEqual({ name: 'Jane', age: 30 })
  })
})

describe('EffectIso', () => {
  it('to/from succeed', () => {
    const numStr = EffectIso<number, string>({ to: (n) => `${n}`, from: (s) => parseInt(s, 10) })
    const to = numStr.to(7)
    expect(Exit.isSuccess(to)).toBe(true)
    if (Exit.isSuccess(to)) expect(to.value).toBe('7')

    const from = numStr.from('10')
    expect(Exit.isSuccess(from)).toBe(true)
    if (Exit.isSuccess(from)) expect(from.value).toBe(10)
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
    expect(Exit.isSuccess(got1)).toBe(true)

    const got2 = addressP.get({ name: 'A' })
    expect(Exit.isFailure(got2)).toBe(true)
  })

  it('set success/failure', () => {
    const res1 = addressP.set({ street: '2', city: 'LA' })({ name: 'A' })
    expect(Exit.isSuccess(res1)).toBe(true)

    const composed = EffectPrism<Person>().compose(addressP, cityL)
    const res2 = composed.set('LA')({ name: 'A' })
    expect(Exit.isFailure(res2)).toBe(true)
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
    expect(Exit.isSuccess(ok)).toBe(true)
    const bad = composed.get({ name: 'A' })
    expect(Exit.isFailure(bad)).toBe(true)
  })
})


