import { PassThrough } from 'stream'

/** Error thrown if one attempts to fetch a message after the stream is closed */
export class StreamEndedError extends Error {}

/** A PassThrough stream equipped with an async fetch() function */
export class Stream<T> extends PassThrough {
    constructor () {
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
}
