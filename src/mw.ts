import { noop, MaybePromise } from './util'
import { MessageEvent } from './receive'

export interface Message extends MessageEvent {}

export type MwFunction =
    (arg: Message, next: () => MaybePromise<void>) => MaybePromise<void>

export class Mw {
    private mw: MwFunction[] = []
    preUse(f: MwFunction) {
        this.mw.unshift(f)
        return this
    }
    use(f: MwFunction) {
        this.mw.push(f)
        return this
    }
    unuse(f: MwFunction) {
        this.mw.splice(this.mw.indexOf(f), 1)
        return this
    }
    call(arg: any, pos = 0) {
        return pos < this.mw.length ?
            this.mw[pos](arg, () =>
                this.call(arg, pos + 1)) :
            Promise.resolve()
    }
}
