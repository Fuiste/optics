import { describe, expect, it } from 'vitest'
import { Lens } from '../src'

type Address = { street: string; city: string }
type Person = { name: string; age: number; address: Address }

describe('Lens', () => {
  const person: Person = {
    name: 'John',
    age: 30,
    address: { street: '123 Main St', city: 'New York' },
  }

  describe('prop', () => {
    const nameLens = Lens<Person>().prop('name')

    it('gets a property value', () => {
      expect(nameLens.get(person)).toBe('John')
    })

    it('sets a property value immutably', () => {
      const updated = nameLens.set('Jane')(person)
      expect(updated.name).toBe('Jane')
      expect(person.name).toBe('John')
      expect(updated.age).toBe(30)
    })

    it('sets via a function updater', () => {
      const updated = nameLens.set((n) => n.toUpperCase())(person)
      expect(updated.name).toBe('JOHN')
      expect(person.name).toBe('John')
    })

    it('handles numeric keys for array access', () => {
      type Company = { employees: Array<{ name: string }> }
      const company: Company = { employees: [{ name: 'Alice' }, { name: 'Bob' }] }
      const firstEmployee = Lens<Company['employees']>().prop(0)
      expect(firstEmployee.get(company.employees)).toMatchInlineSnapshot(`
        {
          "name": "Alice",
        }
      `)
    })

    it('preserves subtypes through set', () => {
      type Base = { name: string }
      type Extended = Base & { age: number }
      const baseLens = Lens<Base>().prop('name')
      const extended: Extended = { name: 'John', age: 30 }
      const updated = baseLens.set('Jane')(extended)
      expect(updated).toMatchInlineSnapshot(`
        {
          "age": 30,
          "name": "Jane",
        }
      `)
    })

    it.skip('rejects invalid property keys at compile time', () => {
      const lens = Lens<Person>()
      // @ts-expect-error - non-existent property
      lens.prop('invalid')
    })

    it.skip('rejects wrong types in set at compile time', () => {
      const ageLens = Lens<Person>().prop('age')
      // @ts-expect-error - string not assignable to number
      ageLens.set('thirty')(person)
    })
  })

  describe('_tag', () => {
    it('is tagged as lens', () => {
      expect(Lens<Person>().prop('name')._tag).toBe('lens')
    })
  })
})
