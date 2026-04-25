import type { Iso } from './types.js'

/**
 * Constructs an isomorphism — a total, invertible mapping between `S` and `A`.
 *
 * ```ts
 * const numStr = Iso<number, string>({ to: n => `${n}`, from: s => parseInt(s, 10) })
 * numStr.to(42)    // '42'
 * numStr.from('7') // 7
 * ```
 */
export const makeIso = <S, A>(iso: { to: (s: S) => A; from: (a: A) => S }): Iso<S, A> => ({
  _tag: 'iso',
  ...iso,
})
