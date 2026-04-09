import { describe, expect, it } from 'vitest'
import { Iso, Lens, Prism, compose } from '../src'

type Address = { street: string; city: string }
type Person = { name: string; address: Address }
type MaybePerson = { name: string; address?: Address }

const person: Person = {
  name: 'Ada',
  address: { street: '123 Main St', city: 'London' },
}

describe('optic laws', () => {
  describe('Lens laws', () => {
    const cityLens = compose(Lens<Person>().prop('address'), Lens<Address>().prop('city'))

    it('get-set restores the original structure', () => {
      expect(cityLens.set(cityLens.get(person))(person)).toBe(person)
    })

    it('set-get returns the written value', () => {
      expect(cityLens.get(cityLens.set('Paris')(person))).toBe('Paris')
    })

    it('set-set keeps only the latest value', () => {
      const once = cityLens.set('Paris')(person)
      const twice = cityLens.set('Berlin')(once)
      expect(twice).toEqual(cityLens.set('Berlin')(person))
    })
  })

  describe('Prism absent-branch rules', () => {
    const addressPrism = Prism<MaybePerson>().of({
      get: (maybePerson) => maybePerson.address,
      set: (address) => (maybePerson) => ({ ...maybePerson, address }),
    })
    const cityPrism = compose(addressPrism, Lens<Address>().prop('city'))

    it('returns undefined when the branch is missing', () => {
      expect(cityPrism.get({ name: 'Ada' })).toBeUndefined()
    })

    it('treats updater sets as a no-op when the branch is missing', () => {
      const original = { name: 'Ada' }
      expect(cityPrism.set((city) => city.toUpperCase())(original)).toBe(original)
    })

    it('treats concrete sets as a no-op through a missing composed path', () => {
      const original = { name: 'Ada' }
      expect(cityPrism.set('Paris')(original)).toBe(original)
    })
  })

  describe('Iso round-trips', () => {
    const numberString = Iso<number, string>({
      to: (value) => `${value}`,
      from: (value) => parseInt(value, 10),
    })

    it('round-trips through to/from', () => {
      expect(numberString.from(numberString.to(7))).toBe(7)
      expect(numberString.to(numberString.from('42'))).toBe('42')
    })
  })
})
