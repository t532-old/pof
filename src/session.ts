import { Stream } from './stream'
import { MaybePromise } from './util'

type IdentifierFunction<T> = (x: T) => MaybePromise<any>
type SessionFunction<T> = (st: Stream<T>) => Promise<void>
type SessionPredicate<T> = (data: T) => MaybePromise<boolean>

interface Sessions<T> {
    makeIdentifier: IdentifierFunction<T>
    use: (p: SessionPredicate<T>, f: SessionFunction<T>) => Sessions<T>
    run: (x: T) => MaybePromise<void>
}

export class SessionManager<T> implements Sessions<T> {
    private sessions: Map<any, Stream<T>> = new Map()
    private fns: {
        exec: SessionFunction<T>
        match: SessionPredicate<T>
    }[] = []
    constructor (
        public readonly makeIdentifier: IdentifierFunction<T>
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
                    const stream = new Stream<T>()
                    exec(stream)
                    .then(() => stream.end())
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

export class CosessionManager<T> implements Sessions<T> {
    private mgrs: SessionManager<T>[] = []
    constructor (
        public readonly makeIdentifier: IdentifierFunction<T>
    ) {}
    use(match: SessionPredicate<T>, exec: SessionFunction<T>) {
        this.mgrs.push(
            new SessionManager<T>(this.makeIdentifier)
            .use(match, exec))
        return this
    }
    async run(x: T) {
        for (const mgr of this.mgrs) {
            mgr.run(x)
        }
    }
}
