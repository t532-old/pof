import { ReceiveObject } from './receive'
import { SendObject } from './send'
import { Mw, Message, MwFunction } from './mw'
import { Arrow, Failure, extract, ExtractMapping, ExtractResult, step } from './step'
import { id } from './util'

export const certain = <T>() => step<T, T>(id)
export const root = certain<Message>()

export const App = ({receive, send, mw = new Mw()}: {
    receive: ReceiveObject
    send: SendObject
    mw?: Mw
}) => ({
    match: <As extends ExtractMapping<Message>>(ps: As) => (f: Arrow<ExtractResult<As>, any>) =>
        mw.use(async (x, next) => {
            try { f(await step (id) [extract] (ps) (x)) }
            catch (e) {
                if (e instanceof Failure) {
                    if (e.message)
                        send.send(x) `${e.message}`
                    return next()
                } else { throw e }
            }
        }),
    get: <As extends ExtractMapping<Message>>(ps: As) => new Promise<ExtractResult<As>>((pure, fail) => {
        const f: MwFunction = async (x, next) => {
            try {
                pure(await step (id) [extract] (ps) (x))
                mw.unuse(f)
            } catch (e) {
                if (e instanceof Failure) {
                    console.log(e)
                    if (e.message)
                        send.send(x) `${e.message}`
                } else fail(e)
                return next()
            }
        }
        mw.preUse(f)
    }),
    start: () =>
        receive.on('message', x => mw.call(x)),
    $in: receive,
    $out: send,
    $mw: mw,
})
