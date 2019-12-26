import { noop, MaybePromise } from './util'
import { Message } from './message'

export type MwFunction =
    (arg: Message, next: () => MaybePromise<void>) => MaybePromise<void>

export class Mw {
    private mw: MwFunction[] = [noop]
    preUse(f: MwFunction) {
        this.mw.unshift(f)
        return this
    }
    use(f: MwFunction) {
        this.mw.push(f)
        return this
    }
    call(arg: Message, pos = 0) {
        return this.mw[pos](arg, () =>
            this.call(arg, pos + 1))
    }
}
