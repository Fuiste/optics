import { describe, expect, it } from 'vitest'

import { Lens, Prism, Traversal, each } from '../src'
import { Iso } from '../src'

describe('Lens', () => {
  describe('prop lens', () => {
    it('should get a property value', () => {
      const person = { name: 'John', age: 30 }
      const nameLens = Lens<typeof person>().prop('name')
      expect(nameLens.get(person)).toBe('John')
    })

    it('should set a property value immutably', () => {
      const person = { name: 'John', age: 30 }
      const nameLens = Lens<typeof person>().prop('name')
      const updatedPerson = nameLens.set('Jane')(person)

      expect(updatedPerson.name).toBe('Jane')
      expect(person.name).toBe('John') // original unchanged
      expect(updatedPerson.age).toBe(30) // other properties preserved
    })

    it('should set a property value immutably via a function', () => {
      const person = { name: 'John', age: 30 }
      const nameLens = Lens<typeof person>().prop('name')
      const updatedPerson = nameLens.set((name) => name.toUpperCase())(person)

      expect(updatedPerson.name).toBe('JOHN')
      expect(person.name).toBe('John') // original unchanged
      expect(updatedPerson.age).toBe(30) // other properties preserved
    })

    /**
     * Testing that we maintain type safety. This test doesn't run, it exists
     * to assert that type errors occur when expected.
     */
    it.skip('should be type-safe', () => {
      const person = { name: 'John', age: 30 }
      const lens = Lens<typeof person>()

      // @ts-expect-error - should not allow non-existent properties
      lens.prop('invalid')

      // @ts-expect-error - should not allow setting wrong type
      lens.prop('age').set('30')(person)
    })

    /**
     * Testing that we maintain type safety for shared interfaces.
     */
    it.skip('should be type-safe for shared interfaces', () => {
      type SomethingWithName = { name: string }
      type Person = SomethingWithName & { age: number }
      const person: Person = { name: 'John', age: 30 }

      const lens = Lens<SomethingWithName>()

      // @ts-expect-error - should not allow non-existent properties
      lens.prop('invalid')

      // Should be allowed to set a property found on the interface
      const nameLens = lens.prop('name')
      const asJane = nameLens.set('Jane')

      // Should be a person type
      const updatedPerson: Person = asJane(person)
      expect(updatedPerson.name).toBe('Jane')

      // Should be a string type
      const name: string = nameLens.get(updatedPerson)
      expect(name).toBe('Jane')
    })
  })

  describe('composed lenses', () => {
    type Address = { street: string; city: string }
    type Person = { name: string; address: Address }

    it('should get nested property', () => {
      const person: Person = {
        name: 'John',
        address: { street: '123 Main St', city: 'New York' },
      }

      const addressLens = Lens<Person>().prop('address')
      const cityLens = Lens<Address>().prop('city')
      const composedLens = Lens<Person>().compose(addressLens, cityLens)

      expect(composedLens.get(person)).toBe('New York')
    })

    it('should set nested property immutably', () => {
      const person: Person = {
        name: 'John',
        address: { street: '123 Main St', city: 'New York' },
      }

      const addressLens = Lens<Person>().prop('address')
      const cityLens = Lens<Address>().prop('city')
      const composedLens = Lens<Person>().compose(addressLens, cityLens)

      const updatedPerson = composedLens.set('Los Angeles')(person)

      expect(updatedPerson.address.city).toBe('Los Angeles')
      expect(person.address.city).toBe('New York') // original unchanged
      expect(updatedPerson.name).toBe('John') // other properties preserved
      expect(updatedPerson.address.street).toBe('123 Main St') // other nested properties preserved
    })

    it('should set nested property immutably via a function', () => {
      const person: Person = {
        name: 'John',
        address: { street: '123 Main St', city: 'New York' },
      }

      const addressLens = Lens<Person>().prop('address')
      const cityLens = Lens<Address>().prop('city')
      const composedLens = Lens<Person>().compose(addressLens, cityLens)

      const updatedPerson = composedLens.set((city) => city.toUpperCase())(person)

      expect(updatedPerson.address.city).toBe('NEW YORK')
      expect(person.address.city).toBe('New York') // original unchanged
      expect(updatedPerson.name).toBe('John') // other properties preserved
      expect(updatedPerson.address.street).toBe('123 Main St') // other nested properties preserved
    })

    /**
     * Testing that we maintain type safety. This test doesn't run, it exists
     * to assert that type errors occur when expected.
     */
    it.skip('should maintain type safety through composition', () => {
      const person: Person = {
        name: 'John',
        address: { street: '123 Main St', city: 'New York' },
      }

      const personLens = Lens<Person>()
      const personNameLens: Lens<Person, string> = personLens.prop('name')
      const personAddressLens: Lens<Person, Address> = personLens.prop('address')
      const cityLens: Lens<Address, string> = Lens<Address>().prop('city')

      // @ts-expect-error - should not allow composing with wrong types
      Lens<Person>().compose(personAddressLens, personNameLens)

      // @ts-expect-error - should not allow setting wrong type
      Lens<Person>().compose(addressLens, cityLens).set(123)(person)
    })
  })

  describe('complex nested structures', () => {
    type Company = { name: string; employees: Array<{ name: string; role: string }> }

    it('should handle array properties', () => {
      const company: Company = {
        name: 'Acme',
        employees: [
          { name: 'John', role: 'Developer' },
          { name: 'Jane', role: 'Manager' },
        ],
      }

      const employeesLens = Lens<Company>().prop('employees')
      const firstEmployeeLens = Lens<Company>().compose(
        employeesLens,
        Lens<typeof company.employees>().prop(0),
      )

      expect(firstEmployeeLens.get(company)).toEqual({ name: 'John', role: 'Developer' })

      const updatedCompany = firstEmployeeLens.set({ name: 'Bob', role: 'Designer' })(company)

      expect(updatedCompany.employees[0]).toEqual({ name: 'Bob', role: 'Designer' })
      expect(company.employees[0]).toEqual({ name: 'John', role: 'Developer' }) // original unchanged
    })
  })
})

describe('Prism', () => {
  describe('basic prism usage', () => {
    type Person = {
      name: string
      age: number
      address?: {
        street: string
        city: string
      }
    }

    it('should get a value when it exists', () => {
      const person: Person = {
        name: 'John',
        age: 30,
        address: { street: '123 Main St', city: 'New York' },
      }

      const addressPrism = Prism<Person>().of({
        get: (person) => person.address,
        set: (address) => (person) => ({ ...person, address }),
      })

      expect(addressPrism.get(person)).toEqual({
        street: '123 Main St',
        city: 'New York',
      })
    })

    it('should return undefined when value does not exist', () => {
      const person: Person = {
        name: 'John',
        age: 30,
      }

      const addressPrism = Prism<Person>().of({
        get: (person) => person.address,
        set: (address) => (person) => ({ ...person, address }),
      })

      expect(addressPrism.get(person)).toBeUndefined()
    })

    it('should set a value immutably', () => {
      const person: Person = {
        name: 'John',
        age: 30,
      }

      const addressPrism = Prism<Person>().of({
        get: (person) => person.address,
        set: (address) => (person) => ({ ...person, address }),
      })

      const newAddress = { street: '456 Oak St', city: 'Los Angeles' }
      const updatedPerson = addressPrism.set(newAddress)(person)

      expect(updatedPerson.address).toEqual(newAddress)
      expect(person.address).toBeUndefined() // original unchanged
      expect(updatedPerson.name).toBe('John') // other properties preserved
      expect(updatedPerson.age).toBe(30) // other properties preserved
    })

    // New: function updater on direct prism
    it('should set a value immutably via a function', () => {
      const person: Person = {
        name: 'John',
        age: 30,
        address: { street: '123 Main St', city: 'New York' },
      }

      const addressPrism = Prism<Person>().of({
        get: (p) => p.address,
        set: (address) => (p) => ({ ...p, address }),
      })

      const updated = addressPrism.set((a) => ({ ...a, city: 'Los Angeles' }))(person)

      expect(updated.address).toEqual({ street: '123 Main St', city: 'Los Angeles' })
      expect(person.address).toEqual({ street: '123 Main St', city: 'New York' })
    })
  })

  describe('prism composition with lenses', () => {
    type Address = { street: string; city: string }
    type Person = {
      name: string
      age: number
      address?: Address
    }

    it('should compose prism with lens', () => {
      const person: Person = {
        name: 'John',
        age: 30,
        address: { street: '123 Main St', city: 'New York' },
      }

      const addressPrism = Prism<Person>().of({
        get: (person) => person.address,
        set: (address) => (person) => ({ ...person, address }),
      })

      const cityLens = Lens<Address>().prop('city')
      const composedPrism = Prism<Person>().compose(addressPrism, cityLens)

      expect(composedPrism.get(person)).toBe('New York')
    })

    it('should set value through prism-lens composition', () => {
      const person: Person = {
        name: 'John',
        age: 30,
        address: { street: '123 Main St', city: 'New York' },
      }

      const addressPrism = Prism<Person>().of({
        get: (person) => person.address,
        set: (address) => (person) => ({ ...person, address }),
      })

      const cityLens = Lens<Address>().prop('city')
      const composedPrism = Prism<Person>().compose(addressPrism, cityLens)

      const updatedPerson = composedPrism.set('Los Angeles')(person)

      expect(updatedPerson.address?.city).toBe('Los Angeles')
      expect(person.address?.city).toBe('New York') // original unchanged
      expect(updatedPerson.address?.street).toBe('123 Main St') // other properties preserved
    })

    // New: function updater through prism-lens composition
    it('should set value via function through prism-lens composition', () => {
      const person: Person = {
        name: 'John',
        age: 30,
        address: { street: '123 Main St', city: 'New York' },
      }

      const addressPrism = Prism<Person>().of({
        get: (p) => p.address,
        set: (address) => (p) => ({ ...p, address }),
      })

      const cityLens = Lens<Address>().prop('city')
      const composed = Prism<Person>().compose(addressPrism, cityLens)

      const updated = composed.set((city) => city.toUpperCase())(person)
      expect(updated.address?.city).toBe('NEW YORK')
    })
  })

  describe('lens composition with prisms', () => {
    type Address = { street: string; city: string }
    type Person = {
      name: string
      age: number
      address: Address
    }

    it('should compose lens with prism', () => {
      const person: Person = {
        name: 'John',
        age: 30,
        address: { street: '123 Main St', city: 'New York' },
      }

      const addressLens = Lens<Person>().prop('address')
      const cityPrism = Prism<Address>().of({
        get: (address) => address.city,
        set: (city) => (address) => ({ ...address, city }),
      })

      const composedPrism = Lens<Person>().compose(addressLens, cityPrism)

      expect(composedPrism.get(person)).toBe('New York')
    })

    it('should set value through lens-prism composition', () => {
      const person: Person = {
        name: 'John',
        age: 30,
        address: { street: '123 Main St', city: 'New York' },
      }

      const addressLens = Lens<Person>().prop('address')
      const cityPrism = Prism<Address>().of({
        get: (address) => address.city,
        set: (city) => (address) => ({ ...address, city }),
      })

      const composedPrism = Lens<Person>().compose(addressLens, cityPrism)

      const updatedPerson = composedPrism.set('Los Angeles')(person)

      expect(updatedPerson.address.city).toBe('Los Angeles')
      expect(person.address.city).toBe('New York') // original unchanged
      expect(updatedPerson.address.street).toBe('123 Main St') // other properties preserved
    })

    // New: function updater through lens-prism composition
    it('should set value via function through lens-prism composition', () => {
      const person: Person = {
        name: 'John',
        age: 30,
        address: { street: '123 Main St', city: 'New York' },
      }

      const addressLens = Lens<Person>().prop('address')
      const cityPrism = Prism<Address>().of({
        get: (a) => a.city,
        set: (city) => (a) => ({ ...a, city }),
      })

      const composed = Lens<Person>().compose(addressLens, cityPrism)

      const updated = composed.set((city) => city.toUpperCase())(person)
      expect(updated.address.city).toBe('NEW YORK')
    })
  })

  describe('prism composition with prisms', () => {
    type Address = { street: string; city: string }
    type Person = {
      name: string
      age: number
      address?: Address
    }

    it('should compose two prisms', () => {
      const person: Person = {
        name: 'John',
        age: 30,
        address: { street: '123 Main St', city: 'New York' },
      }

      const addressPrism = Prism<Person>().of({
        get: (person) => person.address,
        set: (address) => (person) => ({ ...person, address }),
      })

      const cityPrism = Prism<Address>().of({
        get: (address) => address.city,
        set: (city) => (address) => ({ ...address, city }),
      })

      const composedPrism = Prism<Person>().compose(addressPrism, cityPrism)

      expect(composedPrism.get(person)).toBe('New York')
    })

    it('should set value through prism-prism composition', () => {
      const person: Person = {
        name: 'John',
        age: 30,
        address: { street: '123 Main St', city: 'New York' },
      }

      const addressPrism = Prism<Person>().of({
        get: (person) => person.address,
        set: (address) => (person) => ({ ...person, address }),
      })

      const cityPrism = Prism<Address>().of({
        get: (address) => address.city,
        set: (city) => (address) => ({ ...address, city }),
      })

      const composedPrism = Prism<Person>().compose(addressPrism, cityPrism)

      const updatedPerson = composedPrism.set('Los Angeles')(person)

      expect(updatedPerson.address?.city).toBe('Los Angeles')
      expect(person.address?.city).toBe('New York') // original unchanged
      expect(updatedPerson.address?.street).toBe('123 Main St') // other properties preserved
    })

    // New: function updater through prism-prism composition
    it('should set value via function through prism-prism composition', () => {
      const person: Person = {
        name: 'John',
        age: 30,
        address: { street: '123 Main St', city: 'New York' },
      }

      const addressPrism = Prism<Person>().of({
        get: (p) => p.address,
        set: (address) => (p) => ({ ...p, address }),
      })

      const cityPrism = Prism<Address>().of({
        get: (a) => a.city,
        set: (city) => (a) => ({ ...a, city }),
      })

      const composed = Prism<Person>().compose(addressPrism, cityPrism)

      const updated = composed.set((city) => city.toUpperCase())(person)
      expect(updated.address?.city).toBe('NEW YORK')
    })

    it('should handle undefined values in prism-prism composition', () => {
      const person: Person = {
        name: 'John',
        age: 30,
      }

      const addressPrism = Prism<Person>().of({
        get: (person) => person.address,
        set: (address) => (person) => ({ ...person, address }),
      })

      const cityPrism = Prism<Address>().of({
        get: (address) => address.city,
        set: (city) => (address) => ({ ...address, city }),
      })

      const composedPrism = Prism<Person>().compose(addressPrism, cityPrism)

      expect(composedPrism.get(person)).toBeUndefined()

      // Setting should not change the object when the path is undefined
      const updatedPerson = composedPrism.set('Los Angeles')(person)
      expect(updatedPerson).toEqual(person)
    })

    // New: function updater is a no-op when any outer branch is missing
    it('should be a no-op for function setter when path is undefined', () => {
      const person: Person = { name: 'John', age: 30 }

      const addressPrism = Prism<Person>().of({
        get: (p) => p.address,
        set: (address) => (p) => ({ ...p, address }),
      })

      const cityPrism = Prism<Address>().of({
        get: (a) => a.city,
        set: (city) => (a) => ({ ...a, city }),
      })

      const composed = Prism<Person>().compose(addressPrism, cityPrism)
      const updated = composed.set((city) => city.toUpperCase())(person)
      expect(updated).toEqual(person)
    })
  })

  describe('union type handling', () => {
    type Circle = { type: 'circle'; radius: number }
    type Square = { type: 'square'; side: number }
    type Shape = Circle | Square

    it('should handle union types with type guards', () => {
      const circle: Shape = { type: 'circle', radius: 5 }
      const square: Shape = { type: 'square', side: 10 }

      const circlePrism = Prism<Shape>().of({
        get: (shape): Circle | undefined => (shape.type === 'circle' ? shape : undefined),
        set: (circle) => (_) => circle,
      })

      expect(circlePrism.get(circle)).toEqual({ type: 'circle', radius: 5 })
      expect(circlePrism.get(square)).toBeUndefined()

      const updatedCircle = circlePrism.set({ type: 'circle', radius: 7 })(circle)
      expect(updatedCircle).toEqual({ type: 'circle', radius: 7 })
    })

    it('should compose with union types', () => {
      const circle: Shape = { type: 'circle', radius: 5 }

      const circlePrism = Prism<Shape>().of({
        get: (shape): Circle | undefined => (shape.type === 'circle' ? shape : undefined),
        set: (circle) => (_) => circle,
      })

      const radiusLens = Lens<Circle>().prop('radius')
      const composedPrism = Prism<Shape>().compose(circlePrism, radiusLens)

      expect(composedPrism.get(circle)).toBe(5)

      const updatedCircle = composedPrism.set(7)(circle)
      expect(updatedCircle).toEqual({ type: 'circle', radius: 7 })
    })
  })

  describe('complex nested structures with prisms', () => {
    type Company = {
      name: string
      departments?: Array<{
        name: string
        manager?: { name: string; email: string }
      }>
    }

    it('should handle complex nested optional structures', () => {
      const company: Company = {
        name: 'Acme Corp',
        departments: [
          { name: 'Engineering', manager: { name: 'John', email: 'john@acme.com' } },
          { name: 'Marketing' },
        ],
      }

      const firstDepartmentPrism = Prism<Company>().of({
        get: (company) => company.departments?.[0],
        set: (dept) => (company) => ({
          ...company,
          departments: company.departments ? [dept, ...company.departments.slice(1)] : [dept],
        }),
      })

      const managerPrism = Prism<Exclude<Company['departments'], undefined>[number]>().of({
        get: (dept) => dept.manager,
        set: (manager) => (dept) => ({ ...dept, manager }),
      })

      const composedPrism = Prism<Company>().compose(firstDepartmentPrism, managerPrism)

      expect(composedPrism.get(company)).toEqual({ name: 'John', email: 'john@acme.com' })

      const updatedCompany = composedPrism.set({ name: 'Jane', email: 'jane@acme.com' })(company)
      expect(updatedCompany.departments?.[0]?.manager).toEqual({
        name: 'Jane',
        email: 'jane@acme.com',
      })
    })
  })

  describe('type inference utilities', () => {
    type Person = {
      name: string
      age: number
      address?: { street: string; city: string }
    }

    /**
     * Testing that we maintain type safety. This test doesn't run, it exists
     * to assert that type errors occur when expected.
     */
    it.skip('should be type-safe', () => {
      const person: Person = { name: 'John', age: 30 }

      const addressPrism = Prism<Person>().of({
        get: (person) => person.address,
        set: (address) => (person) => ({ ...person, address }),
      })

      // @ts-expect-error - should not allow setting wrong type
      addressPrism.set('invalid')(person)
    })
  })
})

describe('Iso', () => {
  it('should convert back and forth', () => {
    const numberString = Iso<number, string>({ to: (n) => `${n}`, from: (s) => parseInt(s, 10) })

    expect(numberString.to(42)).toBe('42')
    expect(numberString.from('123')).toBe(123)
  })

  it('Lens ∘ Iso should be a Lens', () => {
    type Model = { count: number }
    const countLens = Lens<Model>().prop('count')
    const numberString = Iso<number, string>({ to: (n) => `${n}`, from: (s) => parseInt(s, 10) })

    const countAsString = Lens<Model>().compose(countLens, numberString)

    const m: Model = { count: 7 }
    expect(countAsString.get(m)).toBe('7')
    const updated = countAsString.set('10')(m)
    expect(updated.count).toBe(10)

    const updatedFn = countAsString.set((s) => (parseInt(s, 10) + 1).toString())(m)
    expect(updatedFn.count).toBe(8)
  })

  it('Prism ∘ Iso should be a Prism', () => {
    type Model = { count?: number }
    const countPrism = Prism<Model>().of({
      get: (m) => m.count,
      set: (count) => (m) => ({ ...m, count }),
    })
    const numberString = Iso<number, string>({ to: (n) => `${n}`, from: (s) => parseInt(s, 10) })

    const prism = Prism<Model>().compose(countPrism, numberString)

    expect(prism.get({})).toBeUndefined()
    expect(prism.get({ count: 5 })).toBe('5')

    const updatedFn = prism.set((s) => (parseInt(s, 10) + 1).toString())({ count: 3 })
    expect(updatedFn.count).toBe(4)
  })
})

describe('Traversal', () => {
  describe('basic each traversal', () => {
    it('should getAll return all array elements', () => {
      const arr = [1, 2, 3, 4, 5]
      const numbersTraversal: Traversal<number[], number> = each()

      expect(numbersTraversal.getAll(arr)).toEqual([1, 2, 3, 4, 5])
    })

    it('should getAll return empty array for empty input', () => {
      const arr: string[] = []
      const stringsTraversal: Traversal<string[], string> = each()

      expect(stringsTraversal.getAll(arr)).toEqual([])
    })

    it('should modify apply function to all elements', () => {
      const arr = [1, 2, 3]
      const numbersTraversal: Traversal<number[], number> = each()

      const modified = numbersTraversal.modify((x) => x * 2)(arr)

      expect(modified).toEqual([2, 4, 6])
      expect(arr).toEqual([1, 2, 3]) // original unchanged
    })

    it('should modify work with string transformations', () => {
      const arr = ['hello', 'world']
      const stringsTraversal: Traversal<string[], string> = each()

      const modified = stringsTraversal.modify((s) => s.toUpperCase())(arr)

      expect(modified).toEqual(['HELLO', 'WORLD'])
    })
  })

  describe('Lens ∘ Traversal composition', () => {
    it('should getAll elements from nested array property', () => {
      type Person = { name: string; scores: number[] }
      const people: Person[] = [
        { name: 'Alice', scores: [85, 90, 78] },
        { name: 'Bob', scores: [92, 88] },
        { name: 'Charlie', scores: [76, 84, 91, 80] },
      ]

      const allScoresTraversal = Lens<Person[]>()
        .prop(0)
        .compose(Lens<Person>().prop('scores'))
        .compose(each<number>())

      // Get all scores from first person only
      expect(allScoresTraversal.getAll(people)).toEqual([85, 90, 78])
    })

    it('should modify all elements in nested array', () => {
      type Person = { name: string; ages: number[] }
      const data: Person = {
        name: 'Alice',
        ages: [5, 10, 15],
      }

      const agesTraversal = Lens<Person>().prop('ages').compose(each<number>())

      const modified = agesTraversal.modify((age) => age + 1)(data)

      expect(modified.ages).toEqual([6, 11, 16])
      expect(data.ages).toEqual([5, 10, 15]) // original unchanged
    })

    it('should modify with complex transformation', () => {
      type Student = { id: number; grades: string[] }
      const student: Student = {
        id: 1,
        grades: ['A', 'B+', 'C-', 'A-'],
      }

      const gradesTraversal = Lens<Student>().prop('grades').compose(each<string>())

      const modified = gradesTraversal.modify((grade) => grade + '+')(student)

      expect(modified.grades).toEqual(['A+', 'B++', 'C-+', 'A-+'])
    })
  })

  describe('Traversal ∘ Lens composition', () => {
    it('should getAll a property from each array element', () => {
      type Product = { name: string; price: number }
      const products: Product[] = [
        { name: 'Laptop', price: 999 },
        { name: 'Mouse', price: 25 },
        { name: 'Keyboard', price: 75 },
      ]

      const pricesTraversal = Traversal<Product[], number>().compose(
        each<Product>(),
        Lens<Product>().prop('price'),
      )

      expect(pricesTraversal.getAll(products)).toEqual([999, 25, 75])
    })

    it('should modify a property on each array element', () => {
      type Product = { name: string; price: number }
      const products: Product[] = [
        { name: 'Laptop', price: 999 },
        { name: 'Mouse', price: 25 },
      ]

      const pricesTraversal = Traversal<Product[], number>().compose(
        each<Product>(),
        Lens<Product>().prop('price'),
      )

      const modified = pricesTraversal.modify((price) => price * 0.9)(products)

      expect(modified[0].price).toBeCloseTo(899.1)
      expect(modified[1].price).toBeCloseTo(22.5)
      expect(products[0].price).toBe(999) // original unchanged
    })

    it('should modify with condition', () => {
      type Item = { name: string; quantity: number }
      const items: Item[] = [
        { name: 'Apple', quantity: 5 },
        { name: 'Banana', quantity: 10 },
        { name: 'Cherry', quantity: 3 },
      ]

      const quantitiesTraversal = Traversal<Item[], number>().compose(
        each<Item>(),
        Lens<Item>().prop('quantity'),
      )

      const modified = quantitiesTraversal.modify((q) => (q > 5 ? q * 2 : q))(items)

      expect(modified[0].quantity).toBe(5)
      expect(modified[1].quantity).toBe(20)
      expect(modified[2].quantity).toBe(3)
    })
  })

  describe('Traversal ∘ Traversal composition', () => {
    it('should getAll elements from nested arrays', () => {
      type Matrix = number[][]
      const matrix: Matrix = [
        [1, 2],
        [3, 4],
        [5, 6],
      ]

      const allNumbersTraversal = Traversal<Matrix, number>().compose(
        each<number[]>(),
        each<number>(),
      )

      expect(allNumbersTraversal.getAll(matrix)).toEqual([1, 2, 3, 4, 5, 6])
    })

    it('should modify all elements in nested arrays', () => {
      type Matrix = string[][]
      const matrix: Matrix = [
        ['a', 'b'],
        ['c', 'd'],
      ]

      const allStringsTraversal = Traversal<Matrix, string>().compose(
        each<string[]>(),
        each<string>(),
      )

      const modified = allStringsTraversal.modify((s) => s.toUpperCase())(matrix)

      expect(modified).toEqual([
        ['A', 'B'],
        ['C', 'D'],
      ])
    })
  })

  describe('Traversing through union types with prism', () => {
    it('should getAll only from matching elements in union type array', () => {
      type Circle = { type: 'circle'; radius: number }
      type Square = { type: 'square'; side: number }
      type Shape = Circle | Square

      const shapes: Shape[] = [
        { type: 'circle', radius: 5 },
        { type: 'square', side: 10 },
        { type: 'circle', radius: 7 },
      ]

      // Get all radii from circles only in the array
      const circlePrism = Prism<Shape>().of({
        get: (shape): Circle | undefined => (shape.type === 'circle' ? shape : undefined),
        set: (circle) => (_) => circle,
      })

      // Chain traversals: each Shape → filter to Circle → extract radius
      const radiiTraversal = each<Shape>()
        .compose(circlePrism)
        .compose(Lens<Circle>().prop('radius'))

      expect(radiiTraversal.getAll(shapes)).toEqual([5, 7]) // Only circles
    })

    it('should modify only matching elements in union type array', () => {
      type Circle = { type: 'circle'; radius: number }
      type Square = { type: 'square'; side: number }
      type Shape = Circle | Square

      const shapes: Shape[] = [
        { type: 'circle', radius: 5 },
        { type: 'square', side: 10 },
        { type: 'circle', radius: 7 },
      ]

      // Get all radii from circles only in the array
      const circlePrism = Prism<Shape>().of({
        get: (shape): Circle | undefined => (shape.type === 'circle' ? shape : undefined),
        set: (circle) => (_) => circle,
      })

      // Chain traversals: each Shape → filter to Circle → extract radius
      const radiiTraversal = each<Shape>()
        .compose(circlePrism)
        .compose(Lens<Circle>().prop('radius'))

      const modified = radiiTraversal.modify((r) => r * 2)(shapes)

      expect(modified[0]).toEqual({ type: 'circle', radius: 10 }) // Doubled
      expect(modified[1]).toEqual({ type: 'square', side: 10 }) // Unchanged
      expect(modified[2]).toEqual({ type: 'circle', radius: 14 }) // Doubled
    })
  })

  describe('Iso with traversal', () => {
    it('should getAll with transformation applied', () => {
      type Data = { values: number[] }
      const data: Data = { values: [1, 2, 3] }

      const numToStr = Iso<number, string>({ to: (n) => `${n}`, from: (s) => parseInt(s, 10) })

      // Chain: each number → transform to string via iso
      const strTraversal = Lens<Data>().prop('values').compose(each<number>()).compose(numToStr)

      expect(strTraversal.getAll(data)).toEqual(['1', '2', '3'])
    })
  })

  describe('Traversal ∘ Prism composition', () => {
    it('should getAll only defined values from array of objects with optional property', () => {
      type Item = { name: string; value?: number }
      const items: Item[] = [
        { name: 'A', value: 1 },
        { name: 'B' }, // no value
        { name: 'C', value: 3 },
      ]

      const valuePrism = Prism<Item>().of({
        get: (item) => item.value,
        set: (value) => (item) => ({ ...item, value }),
      })

      const valuesTraversal = Traversal<Item[], number>().compose(each<Item>(), valuePrism)

      expect(valuesTraversal.getAll(items)).toEqual([1, 3]) // Only defined values
    })
  })

  describe('real-world scenarios', () => {
    it('should update all user names in organization hierarchy', () => {
      type User = { id: number; name: string }
      type Team = { name: string; members: User[] }
      type Organization = { name: string; teams: Team[] }

      const org: Organization = {
        name: 'Acme Corp',
        teams: [
          {
            name: 'Engineering',
            members: [
              { id: 1, name: 'Alice' },
              { id: 2, name: 'Bob' },
            ],
          },
          { name: 'Sales', members: [{ id: 3, name: 'Charlie' }] },
        ],
      }

      // Update all user names to uppercase using method chaining
      const namesTraversal = Lens<Organization>()
        .prop('teams')
        .compose(each<Team>())
        .compose(Lens<Team>().prop('members'))
        .compose(each<User>())
        .compose(Lens<User>().prop('name'))

      const modified = namesTraversal.modify((name) => name.toUpperCase())(org)

      expect(modified.teams[0].members[0].name).toBe('ALICE')
      expect(modified.teams[0].members[1].name).toBe('BOB')
      expect(modified.teams[1].members[0].name).toBe('CHARLIE')
    })

    it('should increment all product prices by percentage', () => {
      type Product = { id: number; price: number }
      type Category = { name: string; products: Product[] }
      type Store = { name: string; categories: Category[] }

      const store: Store = {
        name: 'Store A',
        categories: [
          {
            name: 'Electronics',
            products: [
              { id: 1, price: 100 },
              { id: 2, price: 200 },
            ],
          },
          { name: 'Books', products: [{ id: 3, price: 25 }] },
        ],
      }

      // Increase all prices by 10% using method chaining
      const pricesTraversal = Lens<Store>()
        .prop('categories')
        .compose(each<Category>())
        .compose(Lens<Category>().prop('products'))
        .compose(each<Product>())
        .compose(Lens<Product>().prop('price'))

      const modified = pricesTraversal.modify((p) => p * 1.1)(store)

      expect(modified.categories[0].products[0].price).toBeCloseTo(110)
      expect(modified.categories[0].products[1].price).toBeCloseTo(220)
      expect(modified.categories[1].products[0].price).toBeCloseTo(27.5)
    })
  })

  describe('type inference', () => {
    /**
     * Testing that we maintain type safety. This test doesn't run, it exists
     * to assert that types are correctly inferred.
     */
    it.skip('should have correct type inference for each<A>()', () => {
      const numbersTraversal: Traversal<number[], number> = each()
      const stringsTraversal: Traversal<string[], string> = each()

      // Should work with getAll returning ReadonlyArray<A>
      const nums: ReadonlyArray<number> = each().getAll([1, 2, 3])

      // Should work with modify taking (a: A) => A
      const modified = each().modify((x: number) => x + 1)([1, 2, 3])
    })
  })
})
