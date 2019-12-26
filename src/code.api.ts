export type ToCode<N, T> = (x?: T) => { type: N, data: T }

export type CQObject = {
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
    dice: ToCode<'rps', null>
    shake: ToCode<'shake', null>
}
