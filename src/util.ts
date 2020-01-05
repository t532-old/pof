export const defined = (x: any) => x !== null && x !== undefined 

export const flipOut = (x: object, center: string) => {
    if (!defined(x[center])) {
        x[center] = {}
    }
    Object.entries(x).forEach(([k, v]) =>
        k === center || (x[center][`$${k}`] = v))
    return x[center]
}

export const noop = (..._: any[]) => {}

type KvPair = [string, any]
type Kv = Record<string, any>

export const merge = <T extends object, U>(x: T, y: U) =>
    Object.fromEntries([
        ...Object.entries(x), 
        ...Object.entries(y)
    ]) as T & U

type Mapping = (kv: KvPair, idx: number, entries: KvPair[]) => KvPair
export const kvMap = (x: Kv) => (f: Mapping) =>
    Object.fromEntries(
        Object.entries(x).map(f))

type Predicate = (kv: KvPair, idx: number, entries: KvPair[]) => boolean
export const kvFilter = (x: Kv) => (f: Predicate) =>
    Object.fromEntries(
        Object.entries(x).filter(f))

export type MaybePromise<T> = T | Promise<T>

export type Extensive<T> = T & Record<PropertyKey, any>
