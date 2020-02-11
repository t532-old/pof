import { MessageEvent, ReceiveObject, DiscussMessageEvent, GroupMessageEvent, PrivateMessageEvent } from './receive'
import { SendObject } from './send'
import { Mw } from './mw'
import { safe, Arrow, ExtractMapping, extract, certain } from './step'
import { SessionManager, CosessionManager, Sessions } from './session'
import { MessageStream } from './stream'

export type LooseMessageEvent =
    MessageEvent &
    Partial<DiscussMessageEvent> &
    Partial<GroupMessageEvent> &
    Partial<PrivateMessageEvent>

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

export const App = ({
    sender,
    receiver,
    middlewares = new Mw(),
    session = {
        position: new SessionManager(positionOf),
        user: new SessionManager(x => x.user_id.toString()),
        unique: new SessionManager(uniqueIdOf)
    },
    cosession = {
        position: new CosessionManager(positionOf),
        user: new CosessionManager(x => x.user_id.toString()),
        unique: new CosessionManager(uniqueIdOf)
    },
    queue = Promise.resolve(),
}: {
    sender: SendObject
    receiver: ReceiveObject
    middlewares?: Mw<Message>
    session?: Record<string, SessionManager<Message>>
    cosession?: Record<string, CosessionManager<Message>>
    queue?: Promise<void>
}) => ({
    middlewares, sender, receiver,
    session, cosession,
    start: () =>
        receiver.on('message', async (x: LooseMessageEvent) => queue = queue.then(async () => {
            await middlewares.call(x)
            const promises: Promise<void>[] = []
            for (const [, sm] of Object.entries(session)) {
                promises.push(sm.run(x))
            }
            for (const [, sm] of Object.entries(cosession)) {
                promises.push(sm.run(x))
            }
            await Promise.all(promises)
        })),
})

export type MessageHandler<Fst> = (fst: Fst, st: MessageStream<Message>) => Promise<void>

export const match = (sm: Sessions<Message>) => <R>(a: Arrow<Message, R>) => (f: MessageHandler<R>) => {
    let cur: R
    sm.use(
        async x => 
            (cur = await safe(a)(undefined)(x))
                === undefined ? false : true,
        async st => {
            await st.fetch()
            await f(cur, st)
        },
    )
}

export const matchMap = (sm: Sessions<Message>) => <As extends ExtractMapping<Message>>(as: As) =>
    match(sm)((root) [extract] (as))
