import { MaybePromise } from './util'

export type MwFunction<T> =
    (arg: T, next: () => MaybePromise<void>) => MaybePromise<void>

export class Mw<T> {
    static FINISHED = Symbol('Finished')
    private mw: MwFunction<T>[] = []
    preUse(f: MwFunction<T>) {
        this.mw.unshift(f)
        return this
    }
    use(f: MwFunction<T>) {
        this.mw.push(f)
        return this
    }
    unuse(f: MwFunction<T>) {
        this.mw.splice(this.mw.indexOf(f), 1)
        return this
    }
    call(arg: T, pos = 0) {
        try {
            return pos < this.mw.length ?
                this.mw[pos](arg, () =>
                    this.call(arg, pos + 1)) :
                Mw.FINISHED
        } catch (e) { console.error(e) }
    }
}
