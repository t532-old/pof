import { MessageStream } from './stream'
import { MaybePromise } from './util'

type IdentifierFunction<T> = (x: T) => MaybePromise<any>

export interface Sessions<T> {
    makeIdentifier: IdentifierFunction<T>
    create(x: T): Promise<MessageStream<T>>
    run: (x: T) => MaybePromise<void>
}

export class SessionInUseError extends Error {}

export class SessionManager<T> implements Sessions<T> {
    private sessions: Map<any, MessageStream<T>> = new Map() 
    constructor (
        public readonly makeIdentifier: IdentifierFunction<T>
    ) {}
    async create(x: T) {
        const ident = await this.makeIdentifier(x)
        if (this.sessions.has(ident)) {
            throw new SessionInUseError('Session already in use')
        } else {
            const stream = new MessageStream<T>(() =>
                this.sessions.delete(ident))
            this.sessions.set(ident, stream)
            return stream
        }
    }
    async run(x: T) {
        const ident = await this.makeIdentifier(x)
        this.sessions.get(ident)?.write(x)
    }
}

export class CosessionManager<T> implements Sessions<T> {
    private sessions: Map<any, Map<symbol, MessageStream<T>>> = new Map() 
    constructor (
        public readonly makeIdentifier: IdentifierFunction<T>
    ) {}
    async create(x: T) {
        const ident = await this.makeIdentifier(x)
        const sym = Symbol()
        const stream = new MessageStream<T>(() =>
                this.sessions.get(ident).delete(sym))
        if (this.sessions.has(ident)) {
            this.sessions.get(ident).set(sym, stream)
        } else {
            this.sessions.set(ident, new Map([[sym, stream]]))
        }
        return stream
    }
    async run(x: T) {
        const ident = await this.makeIdentifier(x)
        this.sessions.get(ident)
        ?.forEach(v => v.write(x))
    }
}
