import { post } from 'httpie'
import { flipOut } from './util'
import { template } from './code'
import { URL } from 'url'
import { Raw } from './message'
import { ApiObject, ApiInference } from './send.api'

const combine = (inference: string[], { raw }: Raw, data: object) => {
    const combined = {}
    inference.forEach(k => k in raw && (combined[k] = raw[k]))
    Object.entries(data).forEach(([k, v]) => combined[k] = v)
    return combined
}

const api = (url: string, apiKey?: string) => (target: Raw) => new Proxy({}, {
    get: (_, apiName: string) => (data: object = {}) => post(new URL(apiName, url), {
        headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {},
        body: combine(ApiInference[apiName], target, data),
    }).then(res => flipOut(res.data, 'data'))
}) as ApiObject

const makeSend = (api: ApiObject) => (...frags: Parameters<typeof template>) =>
    api.send_msg({ message: template(...frags) })

export const Send = (url: string, apiKey?: string) => ({
    send: (target: Raw) => makeSend(api(url, apiKey)(target)),
    action: api(url, apiKey),
})
