export const defined = (x: any) => x !== undefined

export const flipOut = (x: object, center: string) => {
    Object.entries(x).forEach(([k, v]) =>
        k === center || (x[center][`$${k}`] = v))
    return x[center]
}

export const noop = (...args: any[]) => {}

export type MaybePromise<T> = T | Promise<T>
