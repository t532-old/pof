import { CQObject } from './code.definition'

export interface Code {
    type: string
    data: any
}

export const CQ = new Proxy({}, {
    get: (_, type) => data => ({ type, data })
}) as CQObject

export const template = (text: TemplateStringsArray, ...codes: Code[]) =>
    text
    .filter(str => str.length !== 0)
    .map((text, pos) => [CQ.text({ text }), codes[pos]])
    .flat()
    .slice(0, -1)

export const {
    text, at, anonymous,
    face, emoji, bface, sface,
    image, record, music, share,
    rps, dice, shake
} = CQ
