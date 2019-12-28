export interface Code {
    type: string
    data: any
}

type ToCode<N, T> = (x?: T) => { type: N, data: T }

type CQObject = {
    text: ToCode<'text', { text: string }>
    at: ToCode<'at', { qq: number }>
    anonymous: ToCode<'anonymous', { ignore: boolean }>
    face: ToCode<'face', { id: number }>
    emoji: ToCode<'emoji', { id: number }>
    bface: ToCode<'bface', { id: number }>
    sface: ToCode<'sface', { id: number }>
    record: ToCode<'record', { file: string, magic?: boolean }>
    image: ToCode<'image', { file: string }>
    music: ToCode<'music',
        { type: 'qq' | '163', id: number } |
        { type: 'custom', url: string, audio: string, title: string, content?: string, image?: string }>
    share: ToCode<'share', { url: string, title: string, content?: string, image?: string }>
    rps: ToCode<'rps', null>
    dice: ToCode<'dice', null>
    shake: ToCode<'shake', null>
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
