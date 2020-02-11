import { kvMapAsync, id } from './util'

/**
 * **Pseudo Operator `[then]`** -
 * Compose 2 functions (or `Arrow`s)
 * @example 
 * // This is the haskell-like type signature of this method.
 * then :: (a -> Promise b) -> (b -> Promise c) -> a -> Promise c
 * ```
 * // This is the haskell-like type signature of this method.
 * then :: (a -> Promise b) -> (b -> Promise c) -> a -> Promise c
 * ```
 */
export const then = Symbol('then')
/**
 * **Pseudo Operator `[fail]`** -
 * Set the message thrown when failed (Enclosed inside a `Failure` object)
 * @example 
 * // Haskell-like type signature
 * fail :: (a -> Promise b) -> string -> a -> Promise b ? Promise (Failure string)
 * ```
 * // Haskell-like type signature
 * fail :: (a -> Promise b) -> string -> a -> Promise b ? Promise (Failure string)
 * ```
 */
export const fail = Symbol('fail')
/**
 * **Pseudo Operator `[pass]`** -
 * Compose a function with a boolean predicate, does nothing and pass on when it holds and throws when it does not
 * @example 
 * // Haskell-like type signature
 * pass :: (a -> Promise b) -> (b -> Promise boolean) -> a -> Promise b ? Promise (Failure ())
 * ```
 * // Haskell-like type signature
 * pass :: (a -> Promise b) -> (b -> Promise boolean) -> a -> Promise b ? Promise (Failure ())
 * ```
 */
export const pass = Symbol('pass')
/**
 * **Pseudo Operator `[extract]`** -
 * Create a function that allows to "map" the object produced by the previous one over the record of functions given,
 * producing an object retaining the structure of the record
 * @example 
 * // Haskell-like type signature`
 * extract :: (a -> Promise b) -> {b -> Promise *} -> a -> Promise {*} ? Promise any
 * ```
 * // Haskell-like type signature`
 * extract :: (a -> Promise b) -> {b -> Promise *} -> a -> Promise {*} ? Promise any
 * ```
 */
export const extract = Symbol('extract')
/**
 * **Pseudo Operator `[first]`** -
 * similar to `[extract]`, but stops and returns at the first successful function execution,
 * or throws if none is successfully executed
 * @example 
 * // Haskell-like type signature
 * first :: (a -> Promise b) -> {b -> Promise *} -> a -> Promise {*} ? Promise any
 * ```
 * // Haskell-like type signature
 * first :: (a -> Promise b) -> {b -> Promise *} -> a -> Promise {*} ? Promise any
 * ```
 */
export const first = Symbol('first')

const pure = <T>(x: T) => Promise.resolve(x)

/** A unary callable object that either returns a bare value or a `Promise` (Monad) */
export interface Arrow<T, R> {
    (x: T): Promise<R> | R
}

type Ret<F> = F extends Arrow<any, infer R> ? R : never
export type ExtractMapping<T> = {[K: string]: Arrow<T, any>, [K: number]: Arrow<T, any>}
export type ExtractResult<As> = {[K in keyof As]: Ret<As[K]>}
/** A unary callable object that returns a `Promise` (a Kleisli Arrow) with useful methods */
export interface Step<T, R> {
    (x: T): Promise<R>
    /**
     * **Pseudo Operator `[then]`** -
     * Compose 2 functions (or `Arrow`s)
     * @param f The function to be composed
     * @example
     * // Haskell-like type signature
     * then :: (a -> Promise b) -> (b -> Promise c) -> a -> Promise c ? Promise any
     * ```
     * // Haskell-like type signature
     * then :: (a -> Promise b) -> (b -> Promise c) -> a -> Promise c ? Promise any
     * ```
     */
    [then] <R_>(f: Arrow<R, R_>): Step<T, R_>
    /**
     * **Pseudo Operator `[fail]`** -
     * Template string function. Set the message thrown when failed (Enclosed inside a `Failure` object)
     * @param e The error message
     * @example
     * // Haskell-like type signature
     * fail :: (a -> Promise b) -> string -> a -> Promise b ? Promise (Failure string)
     * ```
     * // Haskell-like type signature
     * fail :: (a -> Promise b) -> string -> a -> Promise b ? Promise (Failure string)
     * ```
     */
    [fail] (...e: Parameters<typeof String.raw>): Step<T, R>
    /**
     * **Pseudo Operator `[pass]`** -
     * Compose a function with a boolean predicate, does nothing and pass on when it holds and throws when it does not
     * @param p The predicate
     * @example
     * // Haskell-like type signature
     * pass :: (a -> Promise b) -> (b -> Promise boolean) -> a -> Promise b ? Promise (Failure ())
     * ```
     * // Haskell-like type signature
     * pass :: (a -> Promise b) -> (b -> Promise boolean) -> a -> Promise b ? Promise (Failure ())
     * ```
     */
    [pass] (p: Arrow<R, boolean>): Step<T, R>
    /**
     * **Pseudo Operator `[extract]`** -
     * Create a function that allows to "map" the object produced by the previous one over the record of functions given,
     * producing an object retaining the structure of the record, and throws if any is not successful
     * @param fs The record of functions
     * @example
     * // Haskell-like type signature
     * extract :: (a -> Promise b) -> {b -> Promise *} -> a -> Promise {*} ? Promise any
     * ```
     * // Haskell-like type signature
     * extract :: (a -> Promise b) -> {b -> Promise *} -> a -> Promise {*} ? Promise any
     * ```
     */
    [extract] <As extends ExtractMapping<R>>(fs: As):
        Step<T, ExtractResult<As>>
    /**
     * **Pseudo Operator `[first]`** -
     * similar to `[extract]`, but stops and returns at the first successful function execution,
     * or throws if none is successfully executed
     * @param fs The record of functions
     * @example
     * // Haskell-like type signature
     * extractFirst :: (a -> Promise b) -> {b -> Promise *} -> a -> Promise {*} ? Promise any
     * ```
     * // Haskell-like type signature
     * extractFirst :: (a -> Promise b) -> {b -> Promise *} -> a -> Promise {*} ? Promise any
     * ```
     */
    [first] <As extends ExtractMapping<R>>(fs: As):
        Step<T, Partial<ExtractResult<As>>>
}

/** Exception within a `Step` computation */
export class Failure {
    constructor(public readonly message?: string) {}
}

/** Wrap a function so that it returns a promise */
export const wrap = <T, R>(f: Arrow<T, R>) => (x: T) =>
    pure(f(x))

/** `Step[then]` not bound to an object */
export const makeThen = <T, R>(f: Arrow<T, R>) => <R_>(g: Arrow<R, R_>) =>
    step((x: T) =>
        wrap(f)(x)
        .then(g))

/** `Step[fail]` not bound to an object */
export const makeFail = <T, R>(f: Arrow<T, R>) => (...e: Parameters<typeof String.raw>) =>
    step((x: T) =>
        wrap(f)(x)
        .catch(() => { throw new Failure(String.raw(...e)) }))

/** Builds an extraction function such that `Step[then](extraction(f)) === Step[extract](f)` */
export const extraction = <T, As extends ExtractMapping<T>>(gs: As) => (x: T) => 
    kvMapAsync (gs)
        (async ([_, g]) =>
            [_, await g(x)])

/** Builds an short-circuited extraction function such that `Step[then](firstExtraction(f)) === Step[first](f)` */       
export const firstExtraction = <T, As extends ExtractMapping<T>>(gs: As) => async (x: T) => {
    for (const [k, f] of Object.entries(gs)) {
        try { return {[k]: await f(x)} }
        catch {}
    }
    throw new Failure()
}

/** Builds a predicate function such that `Step[then](predicate(f)) === Step[pass](f)` */
export const predicate = <T>(f: Arrow<T, boolean>) => (x: T) =>
    wrap(f)(x)
    .then(p => {
        if (p) return x
        else throw new Failure()
    })

/** Build a `Step` object from a plain function */
export const step = <T, R>(f: Arrow<T, R>): Step<T, R> =>
    Object.assign(
        wrap(f), {
            [then]: makeThen(f),
            [extract]: <As extends ExtractMapping<R>>(gs: As) =>
                makeThen(f)(extraction(gs)),
            [first]: <As extends ExtractMapping<R>>(gs: As) =>
                makeThen(f)(firstExtraction(gs)),
            [pass]: (g: Arrow<R, boolean>) =>
                makeThen(f)(predicate(g)),
            [fail]: makeFail(f)
        }) as Step<T, R>

/** Fail with optional message */
export const die = (x?: string) => { throw new Failure(x) }

/** If a promise fails then resolve with a given value */
export const unFailure = <T>(x: Promise<T>) => <U>(alt: U) =>
    x.catch(e => {
        if (e instanceof Failure) return alt
        else throw e
    })

/** unFailure() lifted to arrows */
export const safe = <T, R>(f: Arrow<T, R>) => <S>(alt: S) => (x: T) =>
    unFailure(pure(f(x)))(alt)

/** get a property of an object */
export const prop =
    <T, K extends keyof T>(k: K) =>
        step((x: T) => x[k])

/** id() lifted to arrows */
export const certain = <T>() => step<T, T>(id)
