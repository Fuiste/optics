import { describe, expect, it } from 'vitest'
import { Prism } from '../src'

type Address = { street: string; city: string }
type Person = { name: string; age: number; address?: Address }

const makeAddressPrism = () =>
  Prism<Person>().of({
    get: (p) => p.address,
    set: (address) => (p) => ({ ...p, address }),
  })

describe('Prism', () => {
  describe('of', () => {
    const addressPrism = makeAddressPrism()
    const withAddress: Person = {
      name: 'John',
      age: 30,
      address: { street: '123 Main St', city: 'New York' },
    }
    const withoutAddress: Person = { name: 'John', age: 30 }

    it('gets a value when present', () => {
      expect(addressPrism.get(withAddress)).toMatchInlineSnapshot(`
        {
          "city": "New York",
          "street": "123 Main St",
        }
      `)
    })

    it('returns undefined when absent', () => {
      expect(addressPrism.get(withoutAddress)).toBeUndefined()
    })

    it('sets a concrete value', () => {
      const newAddr = { street: '456 Oak', city: 'LA' }
      const updated = addressPrism.set(newAddr)(withoutAddress)
      expect(updated.address).toMatchInlineSnapshot(`
        {
          "city": "LA",
          "street": "456 Oak",
        }
      `)
      expect(withoutAddress.address).toBeUndefined()
    })

    it('sets via a function updater when present', () => {
      const updated = addressPrism.set((a) => ({ ...a, city: 'LA' }))(withAddress)
      expect(updated.address?.city).toBe('LA')
      expect(withAddress.address?.city).toBe('New York')
    })

    it('no-ops a function updater when absent', () => {
      const updated = addressPrism.set((a) => ({ ...a, city: 'LA' }))(withoutAddress)
      expect(updated).toEqual(withoutAddress)
    })
  })

  describe('union types', () => {
    type Circle = { type: 'circle'; radius: number }
    type Square = { type: 'square'; side: number }
    type Shape = Circle | Square

    const circlePrism = Prism<Shape>().of({
      get: (s): Circle | undefined => (s.type === 'circle' ? s : undefined),
      set: (circle) => (_) => circle,
    })

    it('matches the correct branch', () => {
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

    it('sets a matching value', () => {
      const updated = circlePrism.set({ type: 'circle', radius: 7 })({ type: 'circle', radius: 5 })
      expect(updated).toMatchInlineSnapshot(`
        {
          "radius": 7,
          "type": "circle",
        }
      `)
    })
  })

  describe('_tag', () => {
    it('is tagged as prism', () => {
      expect(makeAddressPrism()._tag).toBe('prism')
    })
  })
})
