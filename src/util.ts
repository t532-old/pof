export const defined = (x: any) => x !== null && x !== undefined 

export const flipOut = (x: object, center: string) => {
    if (!defined(x[center])) {
        x[center] = {}
    }
    Object.entries(x).forEach(([k, v]) =>
        k === center || (x[center][`$${k}`] = v))
    return x[center]
}

export const noop = (...args: any[]) => {}

type KvPair = [string, any]
type Kv = Record<string, any>

export const merge = (...xs: any[]) =>
    Object.fromEntries(xs.map(Object.entries).flat())

export const kvMap = (x: Kv) => (f: (kv: KvPair, idx: number, entries: KvPair[]) => KvPair) =>
    Object.fromEntries(Object.entries(x).map(f))

export const kvFilter = (x: Kv) => (f: (kv: KvPair, idx: number, entries: KvPair[]) => boolean) =>
    Object.fromEntries(Object.entries(x).filter(f))

export type MaybePromise<T> = T | Promise<T>

export type Extensive<T> = T & Record<PropertyKey, any>
