import { MessageStream } from './stream'
import { MaybePromise, noop } from './util'
import { Failure } from './step'

/** Type of identifier generators */
export type IdentifierFunction<T> = (x: T) => MaybePromise<any>
export type SessionFunction<T> = (st: MessageStream<T>) => Promise<void>
export type SessionPredicate<T> = (data: T) => MaybePromise<boolean>

/** Thrown by SessionManager when trying to create a stream for a session already in use */
export class SessionInUseError extends Error {}

/** A session manager based on MessageStream */
export interface Sessions<T> {
    /** The identifier generator.
     * Identifiers are used to distinguish messages in different sessions.
     * Identifier generators should only generate comparable (in other words, primitive) values */
    makeIdentifier: IdentifierFunction<T>
    /** Register a function equipped with a predicate that indicates when to begin a session */
    use: (p: SessionPredicate<T>, f: SessionFunction<T>) => Sessions<T>
    /** Pass an object from a session to the session's corresponding stream */
    run: (x: T) => MaybePromise<void>
}

/** Impelementation of a session manager */
export class SessionManager<T> implements Sessions<T> {
    private sessions: Map<any, MessageStream<T>> = new Map()
    private fns: {
        exec: SessionFunction<T>
        match: SessionPredicate<T>
    }[] = []
    constructor (
        public readonly makeIdentifier: IdentifierFunction<T>,
        public readonly onfail: (m: T, e: Failure) => any = noop,
    ) {}
    use(match: SessionPredicate<T>, exec: SessionFunction<T>) {
        this.fns.push({match, exec})
        return this
    }
    async run(x: T) {
        const ident = await this.makeIdentifier(x)
        if (!this.sessions.has(ident)) {
            for (const {exec, match} of this.fns) {
                if (await match(ident)) {
                    const stream = new MessageStream<T>(
                        () => this.sessions.delete(ident),
                        this.onfail)
                    exec(stream)
                    .then(() => stream.close())
                    .catch(console.error)
                    break
                }
            }
        }
        if (this.sessions.has(ident)) {
            this.sessions.get(ident).write(x)
        }
    }
}

/** An alternative session manager which allows multiple streams to be created on the same session */
export class CosessionManager<T> implements Sessions<T> {
    private mgrs: SessionManager<T>[] = []
    constructor (
        public readonly makeIdentifier: IdentifierFunction<T>,
        public readonly onfail: (m: T, e: Failure) => any = noop,
    ) {}
    use(match: SessionPredicate<T>, exec: SessionFunction<T>) {
        this.mgrs.push(
            new SessionManager<T>(this.makeIdentifier, this.onfail)
            .use(match, exec))
        return this
    }
    async run(x: T) {
        for (const mgr of this.mgrs) {
            mgr.run(x)
        }
    }
}
