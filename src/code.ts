import { defined } from './util'

export type CodeType =
    'text' | 'at' | 'anonymous' |
    'face' | 'emoji' | 'bface' | 'sface' |
    'record' | 'image' | 'music' | 'share' | 'location' |
    'rps' | 'dice' | 'shake' | 'sign'
export interface Code<N = CodeType, T = any> {
    type: N
    data: T
}

type ToCode<N, T> = (x?: T) => {type: N, data: T}
type CQObject = {
    text: ToCode<'text', {text: string}>
    at: ToCode<'at', {qq: number}>
    anonymous: ToCode<'anonymous', {ignore: boolean}>
    face: ToCode<'face', {id: number}>
    emoji: ToCode<'emoji', {id: number}>
    bface: ToCode<'bface', {id: number}>
    sface: ToCode<'sface', {id: number}>
    record: ToCode<'record', {file: string, magic?: boolean}>
    image: ToCode<'image', {file: string}>
    music: ToCode<'music',
        {type: 'qq' | '163', id: number} |
        {type: 'custom', url: string, audio: string, title: string, content?: string, image?: string}>
    share: ToCode<'share', {url: string, title: string, content?: string, image?: string}>
    location: ToCode<'location', {lat: number, lon: number, title: string, content: string}>
    rps: ToCode<'rps', null>
    dice: ToCode<'dice', null>
    shake: ToCode<'shake', null>
}

export const CQ = new Proxy({}, {
    get: (_, type) => data => ({type, data})
}) as CQObject

const isCode = (x: any): x is Code =>
    defined(x) &&
    typeof x === 'object' && 
    typeof x.type === 'string' &&
    defined(x.data) &&
    typeof x.data === 'object'
const toCode = (x: any) => isCode(x) ? x : CQ.text({text: x.toString()})
export const template = (text: TemplateStringsArray, ...codes: Code[]) =>
    text
    .filter(str => str.length !== 0)
    .map((text, pos) => [CQ.text({text}), toCode(codes[pos])])
    .flat()
    .slice(0, -1)

const encodePlainText = (str: string) =>
    str
    .replace(/&/g, '&amp;')
    .replace(/\[/g, '&#91;')
    .replace(/\]/g, '&#93;')
const decodePlainText = (str: string) =>
    str
    .replace(/&amp;/g, '&')
    .replace(/&#91;/g, '[')
    .replace(/&#93;/g, ']')
const encodeCodeText = (str: string) =>
    encodePlainText(str)
    .replace(/,/g, '&#44;')
const decodeCodeText = (str: string) =>
    decodePlainText(str)
    .replace(/&#44;/g, ',')
export const toText = (codes: Code[]) =>
    codes
    .map(x => x.type === 'text' ?
        encodePlainText(x.data.text) :
        `[CQ:${x.type},${
            Object.entries(x.data)
            .map(([k, v]) =>
                `${k}=${encodeCodeText(v.toString())}`)
            .join(',')
        }]`)
    .join('')
const fromCodeSegment = (x: string) => {
    const [_, type, kvs] = x.match(/\[CQ:(\w+)(?:,(.*))?\]/)
    return {
        type,
        data: Object.fromEntries(kvs
        .split(',')
        .map(x => x.split('='))
        .map(([k, v]) => [k, decodeCodeText(v)]))
    }
}
export const toArray = (str: string) =>
    str
    .split(/(?=\[)|(?<=\])/)
    .map(x => x.startsWith('[') ?
        fromCodeSegment(x) :
        CQ.text({text: decodePlainText(x)}))

export const {
    text, at, anonymous,
    face, emoji, bface, sface,
    image, record, music, share, location,
    rps, dice, shake
} = CQ
