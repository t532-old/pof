import { kvMapAsync, defined } from './util'

type MatchType<P> = P extends Pattern<any, infer R> ? R : never
type Mapping<T, R> = (from: T) => Promise<R>
export interface Pattern<T, R> {
    exec(against: T): Promise<R>
    match<Ps extends Record<PropertyKey, Pattern<R, any>>>(subpatts: Ps): 
        Pattern<T, {[K in keyof Ps]: MatchType<Ps[K]>}>
    pipe<P extends Pattern<R, any>>(patt: P):
        Pattern<T, MatchType<P>>
}

export abstract class PatternBase<T, R> implements Pattern<T, R> {
    abstract exec(against: T): Promise<R>
    match<Ps extends Record<PropertyKey, Pattern<R, any>>>(subpatts: Ps):
    Pattern<T, {[K in keyof Ps]: MatchType<Ps[K]>}> {
        return new TrivialPattern(async data => {
            const matched = await this.exec(data)
            return defined(matched) ? 
                kvMapAsync (subpatts) (async ([key, patt]) =>
                    [key, await patt.exec(matched)]) as Promise<{[K in keyof Ps]: MatchType<Ps[K]>}> :
                null
        })
    }
    pipe<P extends Pattern<R, any>>(patt: P):
    Pattern<T, MatchType<P>> {
        return new TrivialPattern(async data => {
            const matched = await this.exec(data)
            return defined(matched) ?
                patt.exec(matched) :
                null
        })
    }
}

export class TrivialPattern<T, R> extends PatternBase<T, R> {
    constructor(
        public exec: Mapping<T, R>
    ) {
        super()
    }
}
