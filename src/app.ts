import { MessageEvent, ReceiveObject, DiscussMessageEvent, GroupMessageEvent, PrivateMessageEvent } from './receive'
import { SendObject } from './send'
import { Mw } from './mw'
import { Arrow, ExtractMapping, extract, certain, Failure } from './step'
import { SessionManager, CosessionManager, Sessions } from './session'
import { MessageStream } from './stream'

export type LooseMessageEvent =
    MessageEvent &
    Omit<Partial<DiscussMessageEvent>, 'message_type' | 'sub_type'> &
    Omit<Partial<GroupMessageEvent>, 'message_type' | 'sub_type'> &
    Omit<Partial<PrivateMessageEvent>, 'message_type' | 'sub_type'> &
    {sub_type: 'friend' | 'group' | 'discuss' | 'other' | 'normal' | 'anonymous' | 'notice'}

export interface Message extends LooseMessageEvent {}

export const root = certain<Message>()

export const positionOf = (x: Message) => {
    if (x.message_type === 'discuss')
        return `D${x.discuss_id}`
    if (x.message_type === 'group')
        return `G${x.group_id}`
    else
        return `P${x.user_id}`
}

export const uniqueIdOf = (x: Message) => 
    x.user_id.toString() + positionOf(x)

const sendError = (sender: SendObject) => (m: Message, e: Failure) =>
    e.message && sender.send(m) `${e.message}`

type OnfailFunction = (m: Message, e: Failure) => any

export const App = ({
    sender,
    receiver,
    middlewares = new Mw(),
    onfail = sendError(sender),
    session = {
        position: new SessionManager(positionOf, onfail),
        user: new SessionManager(x => x.user_id.toString(), onfail),
        unique: new SessionManager(uniqueIdOf, onfail)
    },
    cosession = {
        position: new CosessionManager(positionOf, onfail),
        user: new CosessionManager(x => x.user_id.toString(), onfail),
        unique: new CosessionManager(uniqueIdOf, onfail)
    },
    queue = Promise.resolve(),
}: {
    sender: SendObject
    receiver: ReceiveObject
    onfail: OnfailFunction,
    middlewares?: Mw<Message>
    session?: Record<string, SessionManager<Message>>
    cosession?: Record<string, CosessionManager<Message>>
    queue?: Promise<void>
}) => ({
    middlewares, sender, receiver,
    session, cosession,
    match: match(onfail),
    matchMap: matchMap(onfail),
    start: () =>
        receiver.on('message', async x => queue = queue.then(async () => {
            await middlewares.call(x as LooseMessageEvent)
            const promises: Promise<void>[] = []
            for (const [, sm] of Object.entries(session)) {
                promises.push(sm.run(x as LooseMessageEvent))
            }
            for (const [, sm] of Object.entries(cosession)) {
                promises.push(sm.run(x as LooseMessageEvent))
            }
            await Promise.all(promises)
        })),
})

export type MessageHandler<Fst> = (fst: Fst, st: MessageStream<Message>) => Promise<void>

const match = (onfail: OnfailFunction) => (sm: Sessions<Message>) => <R>(a: Arrow<Message, R>) => (f: MessageHandler<R>) => {
    let raw: Message, cur: R
    sm.use(
        async x => {
            try {
                raw = x
                cur = await a(x)
                return true
            } catch (e) {
                if (!(e instanceof Failure)) {
                    throw e
                } else {
                    onfail(raw, e)
                    return false
                }
            }
        },
        async st => {
            await st.fetch()
            await f(cur, st)
        },
    )
}

const matchMap = (onfail: OnfailFunction) => (sm: Sessions<Message>) => <As extends ExtractMapping<Message>>(as: As) =>
    match(onfail)(sm)((root) [extract] (as))
