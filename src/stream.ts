import { PassThrough } from 'stream'
import { Arrow, Failure } from './step'

/** Error thrown if one attempts to fetch a message after the stream is closed */
export class StreamEndedError extends Error {}

/** A PassThrough stream
 * equipped with an async fetch() function and a conditioned get() function */
export class MessageStream<T> extends PassThrough {
    constructor (
        private readonly del: () => void
    ) {
        super({objectMode: true})
    }
    fetch() { return new Promise<T>(async (pure, fail) => {
        if (!this.readable)
            fail(new StreamEndedError())
        const firstTry = this.read()
        if (firstTry !== null)
            pure(firstTry)
        const onReadable = () => {
            pure(this.read())
            this.off('close', onClose)
        }
        const onClose = () => {
            fail(new StreamEndedError())
            this.off('close', onClose)
        }
        this.once('readable', onReadable)
        this.once('close', onClose)
    })}
    async get<R>(f: Arrow<T, R>) {
        while (true) {
            try {
                return await f(await this.fetch())
            } catch (e) {
                if (e instanceof Failure) {
                    continue
                } else {
                    throw e
                }
            }
        }
    }
    close() {
        this.end()
        this.del()
    }
}
