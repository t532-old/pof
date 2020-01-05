import { Extensive } from './util'
import { Code, toArray } from './code'

export interface Raw<T> {_raw: T}
export type MaybeRaw<T> = Raw<T> | T
export const raw = <T>(x: MaybeRaw<T>) => ('raw' in x ? (x as Raw<T>)._raw : x) as T

export interface Sieveable {_sieveable: Code[] | string}
export type MaybeSieveable = Extensive<{_sieveable: Code[] | string}> | Code[] | string
export const sieveable = (x: MaybeSieveable) => {
    if (typeof x === 'string')
        return toArray(x)
    if (x instanceof Array)
        return x
    return sieveable(x._sieveable)
}
