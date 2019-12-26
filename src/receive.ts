import { createServer, ServerResponse } from 'http'
import { Readable } from 'stream'
import { createHmac } from 'crypto'
import { EventEmitter } from 'events'
import { defined } from './util'
import { Message } from './message'

const read = (stream: Readable) => new Promise<string>($return => {
    let result = ''
    stream.on('data', data => result += data)
    stream.on('end', () => $return (result))
})

const endResponse = (res: ServerResponse, code: number) => {
    res.statusCode = code
    res.end()
}

export type ReceiveListener = (msg: Message) => void

export const Receive = (port: number, secret?: string) => {
    const emitter = new EventEmitter()
    createServer(async (req, res) => {
        const strMsg = await read(req)
        let jsonMsg: object
        try { jsonMsg = JSON.parse(strMsg) }
        catch { return endResponse(res, 400) }
        if (defined(secret)) {
            if (!defined(req.headers['x-signature'])) {
                return endResponse(res, 401)
            }
            if (req.headers['x-signature'] !==
                createHmac('sha1', secret)
                .update(strMsg)
                .digest('hex')) {
                return endResponse(res, 403)
            }
        }
        const parsedMsg = makeMessage(jsonMsg)
        parsedMsg.types.forEach(x => emitter.emit(x, parsedMsg))
    }).listen(port)
    return emitter
}
