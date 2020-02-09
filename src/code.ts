import { defined } from './util'

/** Object representation of CQCodes */
export interface Code<N = CodeType, T = any> {
    type: N
    data: T
}

/** Available CQCode types */
export type CodeType =
    'text' | 'at' | 'anonymous' |
    'face' | 'emoji' | 'bface' | 'sface' |
    'record' | 'image' | 'music' | 'share' | 'location' |
    'rps' | 'dice' | 'shake' | 'sign'

/** Content of CQCode types */
export type CodeContent = {
    text: {text: string}
    at: {qq: number}
    anonymous: {ignore: boolean}
    face: {id: number}
    emoji: {id: number}
    bface: {id: number}
    sface: {id: number}
    record: {file: string, magic?: boolean}
    image: {file: string}
    music:
        {type: 'qq' | '163', id: number} |
        {type: 'custom', url: string, audio: string, title: string, content?: string, image?: string}
    share: {url: string, title: string, content?: string, image?: string}
    location: {lat: number, lon: number, title: string, content: string}
    rps: null
    dice: null
    shake: null
}

/**
 * Shorthand for constructing CQCodes
 * @example `CQ.image({file: '/example/path/foo.jpg'}) === {type: 'image', data: {file: '/example/path/foo.jpg'}}`
 */
export const CQ = new Proxy({}, {
    get: (_, type) => data => ({type, data})
}) as {[k in keyof CodeContent]:
    (x?: CodeContent[k]) => Code<k, CodeContent[k]>}

export const isCode = (x: any): x is Code =>
    defined(x) &&
    typeof x === 'object' && 
    typeof x.type === 'string' &&
    defined(x.data) &&
    typeof x.data === 'object'
export const toCode = (x: any) => isCode(x) ? x : CQ.text({text: String(x)})
/** Template string function that forms `Code[]` from a template string */
export const template = (text: TemplateStringsArray, ...codes: any[]) =>
    text
    .filter(str => str.length !== 0)
    .map((text, pos) => [CQ.text({text}), toCode(codes[pos])])
    .flat()
    .slice(0, -1)

export const encodePlainText = (str: string) =>
    str
    .replace(/&/g, '&amp;')
    .replace(/\[/g, '&#91;')
    .replace(/\]/g, '&#93;')
export const decodePlainText = (str: string) =>
    str
    .replace(/&amp;/g, '&')
    .replace(/&#91;/g, '[')
    .replace(/&#93;/g, ']')
export const encodeCodeText = (str: string) =>
    encodePlainText(str)
    .replace(/,/g, '&#44;')
export const decodeCodeText = (str: string) =>
    decodePlainText(str)
    .replace(/&#44;/g, ',')
/** Convert `Code[]` to equivalent `string` representation */
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
export const fromCodeSegment = (x: string) => {
    const [_, type, kvs] = x.match(/\[CQ:(\w+)(?:,(.*))?\]/)
    return {
        type,
        data: Object.fromEntries(kvs
        .split(',')
        .map(x => x.split('='))
        .map(([k, v]) => [k, decodeCodeText(v)]))
    }
}
/** Convert `string` to equivalent `Code[]` representation */
export const toArray = (str: string) =>
    str
    .split(/(?=\[)|(?<=\])/)
    .map(x => x.startsWith('[') ?
        fromCodeSegment(x) :
        CQ.text({text: decodePlainText(x)}))

/** Pick a certian type of CQCode from Code[] */
export const pick = new Proxy({}, {
    get: (_, type) => (data: Code[]) =>
        data.filter(i => type == i.type).map(x => x.data)
}) as {[k in keyof CodeContent]:
    (x: Code[]) => CodeContent[k][]}

/** Pick the first Code of a certain type from Code[] */
export const pickFirst = new Proxy({}, {
    get: (_, type) => (data: Code[]) =>
        pick[type](data)[0] ?? null
}) as {[k in keyof CodeContent]:
    (x: Code[]) => CodeContent[k] | null}

/** Pick the last Code of a certain type from Code[] */
export const pickLast = new Proxy({}, {
    get: (_, type) => (data: Code[]) =>
        pick[type](data).reverse()[0] ?? null
}) as {[k in keyof CodeContent]:
    (x: Code[]) => CodeContent[k] | null}

/** Pick all plain text from Code[] */
export const pickText = (data: Code[]) =>
    pick.text(data).map(i => i.text).join('')

/** Pick all numerals (no multi-negation, leading or trailing point) */
export const pickNumber = (data: Code[]) => 
    pickText(data)
    .match(/[+-]?\d+(\.\d+)?/g)
    .map(x => parseFloat(x))
