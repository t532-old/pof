/** Check if a value is identical to either `null` or `undefined` */
export const defined = (x: any) => x !== null && x !== undefined 

/**
 * "flip out" a certain part of an object and merge with the rest (the keys of which is prepended with `$`)
 * @example `flipOut({a: {x: 1, y: 2}, b: 3}, 'a') === {x: 1, y: 2, $b: 3}`
 * @param center the key to be flipped out
 */
export const flipOut = (x: object, center: string) => {
    if (!defined(x[center])) {
        x[center] = {}
    }
    Object.entries(x).forEach(([k, v]) =>
        k === center || (x[center][`$${k}`] = v))
    return x[center]
}

/** No-op function */
export const noop = (..._: any[]) => {}
/** Const function */
export const constantly = <T>(x: T) => (..._: any[]) => x
/** Identity function */
export const id = <T>(x: T) => x

type KvPair = [PropertyKey, any]

/** Shallow merge 2 objects */
export const merge = <T extends object>(x: T) => <U extends object>(y: U) =>
    Object.fromEntries([
        ...Object.entries(x), 
        ...Object.entries(y)
    ]) as T & U

type Mapping = (kv?: KvPair, idx?: number, entries?: KvPair[]) => KvPair
/** Map an object's all iterable entries and form a new object */
export const kvMap = <T>(x: T) => (f: Mapping) => 
    Object.fromEntries(
        Object.entries(x).map(f))
type AsyncMapping = (kv?: KvPair, idx?: number, entries?: KvPair[]) => Promise<KvPair>
/** Asynchronously map an object's all iterable entries and form a new object */
export const kvMapAsync = <T>(x: T) => async (f: AsyncMapping) =>
    Promise.all(Object.entries(x).map(f))
    .then(Object.fromEntries)

type Predicate = (kv?: KvPair, idx?: number, entries?: KvPair[]) => boolean
/** Filter an object's all iterable entries with a boolean predicate and form a new object */
export const kvFilter = <T>(x: T) => (f: Predicate) =>
    Object.fromEntries(
        Object.entries(x).filter(f))

export type MaybePromise<T> = T | Promise<T>
export type UnpackPromise<T> = T extends Promise<infer Tx> ? Tx : T 

/** Allow objects to contain keys not in T */
export type Extensive<T> = T & Record<PropertyKey, any>
