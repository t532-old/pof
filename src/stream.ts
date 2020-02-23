import { PassThrough } from 'stream'
import { Arrow, Failure } from './step'

/** Error thrown if one attempts to fetch a message after the stream is closed */
export class StreamEndedError extends Error {}
/** Error thrown if fetch() time limit is exceeded */
export class StreamTimeoutError extends Error {}
/** Error thrown if get() max attempts limit is exceeded() */
export class StreamMaxAttemptsError extends Error {}

/** A PassThrough stream
 * equipped with an async fetch() function and a conditioned get() function */
export class MessageStream<T> extends PassThrough {
    constructor (
        private readonly del: () => void,
        private readonly onfail: (m: T, e: Failure) => any,
    ) {
        super({objectMode: true})
    }
    /** Wait until there is an object in the stream, like read() but will wait.
     * Note that this is NOT intended to be called concurrently (i.e. Do not call without await) */
    fetch(timeout = Infinity) { return new Promise<T>(async (pure, fail) => {
        if (!this.readable)
            fail(new StreamEndedError())
        const firstTry = this.read()
        if (firstTry !== null)
            pure(firstTry)
        const timeoutHook = timeout === Infinity ? setTimeout(() => {
            fail(new StreamTimeoutError())
            this.off('close', onClose)
            this.off('readable', onReadable)
        }, timeout) : null
        const onReadable = () => {
            pure(this.read())
            this.off('close', onClose)
            clearTimeout(timeoutHook)
        }
        const onClose = () => {
            fail(new StreamEndedError())
            this.off('readable', onReadable)
            clearTimeout(timeoutHook)
        }
        this.once('readable', onReadable)
        this.once('close', onClose)
    })}
    /** fetch message asynchronously with conditions, transformations, max attempts and timeout.
     * Note that this is NOT intended to be called concurrently (i.e. Do not call without await) */
    async get<R>(f: Arrow<T, R>, { maxAttempts = Infinity, timeout = Infinity }) {
        for (let attempts = 1; attempts <= maxAttempts; attempts++) {
            const timeBefore = Date.now()
            let obj: T
            try {
                obj = await this.fetch(timeout)
                return await f(obj)
            } catch (e) {
                if (!(e instanceof Failure)) {
                    throw e
                } else this.onfail(obj, e)
            }
            const timeElapsed = Date.now() - timeBefore
            timeout = Math.max(0, timeout - timeElapsed)
        }
        throw new StreamMaxAttemptsError()
    }
    /** Close the stream and release related resource. Use this instead of end(), unless intentional */
    close() {
        this.end()
        this.del()
    }
}
