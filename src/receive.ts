import { createServer, ServerResponse } from 'http'
import { Readable } from 'stream'
import { createHmac } from 'crypto'
import { EventEmitter } from 'events'
import { defined } from './util'
import TypedEventEmitter from 'strict-event-emitter-types'
import { Code } from './code'
import { GetFriendInfoResponse, GetGroupMemberInfoResponse, GetStrangerInfoResponse, GetStatusResponse } from './send'

const read = (stream: Readable) => new Promise<string>(pure => {
    let result = ''
    stream.on('data', data => result += data)
    stream.on('end', () => pure(result))
})

const endResponse = (res: ServerResponse, code: number) => {
    res.statusCode = code
    res.end()
}

/** All supported CQHTTP Post event names */
export type EventName =
    '*' | 'message' |
    'message$private' | 'message$private$friend' |  'message$private$group' | 'message$private$discuss' | 'message$private$other' |
    'message$group' | 'message$group$normal' | 'message$group$anonymous' | 'message$group$notice' | 'message$discuss' |
    'notice' | 'notice$group_upload' |
    'notice$group_admin' | 'notice$group_admin$set' | 'notice$group_admin$unset' |
    'notice$group_decrease' | 'notice$group_decrease$leave' | 'notice$group_decrease$kick' | 'notice$group_decrease$kick_me' |
    'notice$group_increase' | 'notice$group_increase$approve' | 'notice$group_increase$invite' |
    'notice$group_ban' | 'notice$group_ban$ban' | 'notice$group_ban$lift_ban' | 'notice$friend_add' |
    'request' | 'request$friend' |
    'request$group' | 'request$group$add' | 'request$group$invite' |
    'meta_event' | 'meta_event$lifecycle' | 'meta_event$lifecycle$enable' | 'meta_event$lifecycle$disable' |
    'meta_event$heartbeat'

export type EventBase = {time: number, self_id: number, types: EventName[]}
export type GroupEvent = {group_id: number}
export type UserEvent = {user_id: number}
export type DiscussEvent = {discuss_id: number}
export type SubtypedEvent = {sub_type: string}
export type MessageEvent<T extends 'private' | 'group' | 'discuss'
    = 'private' | 'group' | 'discuss'> = EventBase & UserEvent & {
    post_type: 'message'
    message_type: T
    message_id: number
    message: string
    message_array: Code[]
    raw_message: string
    font: number
}
export type PrivateMessageEvent<St extends 'friend' | 'group' | 'discuss' | 'other'
    = 'friend' | 'group' | 'discuss' | 'other'> = MessageEvent<'private'> & {
    sub_type: St
    sender: GetStrangerInfoResponse | GetFriendInfoResponse
}
export type GroupMessageEvent<St extends 'normal' | 'anonymous' | 'notice'
    = 'normal' | 'anonymous' | 'notice'> = MessageEvent<'group'> & GroupEvent & {
    sub_type: St
    anonymous?: {id: number, name: string, flag: string}
    sender: GetGroupMemberInfoResponse
}
export type DiscussMessageEvent = MessageEvent<'discuss'> & DiscussEvent & {
    sender: GetStrangerInfoResponse
}
export type NoticeEvent<T extends 'group_upload' | 'group_admin' | 'group_decrease' | 'group_increase' | 'group_ban' | 'friend_add'
= 'group_upload' | 'group_admin' | 'group_decrease' | 'group_increase' | 'group_ban' | 'friend_add'> = EventBase & {
    post_type: 'notice'
    notice_type: T
}
export type UploadNoticeEvent = NoticeEvent<'group_upload'> & GroupEvent & UserEvent & {
    file: {
        id: string
        name: string
        size: number
        busid: number
    }
}
export type AdminNoticeEvent<St extends 'set' | 'unset'
    = 'set' | 'unset'> = NoticeEvent<'group_admin'> & GroupEvent & UserEvent & {
    sub_type: St
}
export type DecreaseNoticeEvent<St extends 'leave' | 'kick' | 'kick_me'
    = 'leave' | 'kick' | 'kick_me'> = NoticeEvent<'group_decrease'> & GroupEvent & UserEvent & {
    sub_type: St
    operator_id: number
}
export type IncreaseNoticeEvent<St extends 'approve' | 'invite'
    = 'approve' | 'invite'> = NoticeEvent<'group_increase'> & GroupEvent & UserEvent & {
    sub_type: St
    operator_id: number
}
export type BanNoticeEvent<St extends 'ban' | 'lift_ban'
    = 'ban' | 'lift_ban'> = NoticeEvent<'group_ban'> & GroupEvent & UserEvent & {
    sub_type: St
    operator_id: number
    duration: number
}
export type FriendNoticeEvent = NoticeEvent<'friend_add'> & UserEvent
export type RequestEvent<T extends 'friend' | 'group'
    = 'friend' | 'group'> = EventBase & {
    post_type: 'request'
    request_type: T
}
export type FriendRequestEvent = RequestEvent<'friend'> & UserEvent & {
    comment: string
    flag: string
}
export type GroupRequestEvent<St extends 'add' | 'invite'
    = 'add' | 'invite'> = RequestEvent<'group'> & GroupEvent & UserEvent & {
    sub_type: St
    comment: string
    flag: string
}
export type MetaEvent<T extends 'lifecycle' | 'heartbeat'
    = 'lifecycle' | 'heartbeat'> = EventBase & {
    post_type: 'meta_event'
    meta_event_type: T
}
export type LifecycleMetaEvent<St extends 'enable' | 'disable'
    = 'enable' | 'disable'> = MetaEvent<'lifecycle'> & {
    sub_type: St
}
export type HeartbeatMetaEvent = MetaEvent<'heartbeat'> & {
    status: GetStatusResponse
    interval: number
}

export type Listener<T> = (e: T) => void
export type ReceiveObject = TypedEventEmitter<EventEmitter, {
    '*': Listener<
        PrivateMessageEvent |
        GroupMessageEvent |
        DiscussMessageEvent |
        AdminNoticeEvent | 
        BanNoticeEvent |
        DecreaseNoticeEvent |
        FriendNoticeEvent |
        IncreaseNoticeEvent |
        UploadNoticeEvent |
        FriendRequestEvent |
        GroupRequestEvent |
        LifecycleMetaEvent |
        HeartbeatMetaEvent>
    message: Listener<
        PrivateMessageEvent |
        GroupMessageEvent |
        DiscussMessageEvent>
    message$private: Listener<PrivateMessageEvent>
    message$private$friend: Listener<PrivateMessageEvent<'friend'>>
    message$private$group: Listener<PrivateMessageEvent<'group'>>
    message$private$discuss: Listener<PrivateMessageEvent<'discuss'>>
    message$private$other: Listener<PrivateMessageEvent<'other'>>
    message$group: Listener<GroupMessageEvent>
    message$group$normal: Listener<GroupMessageEvent<'normal'>>
    message$group$anonymous: Listener<GroupMessageEvent<'anonymous'>>
    message$group$notice: Listener<GroupMessageEvent<'notice'>>
    message$discuss: Listener<DiscussMessageEvent>
    notice: Listener<
        AdminNoticeEvent | 
        BanNoticeEvent |
        DecreaseNoticeEvent |
        FriendNoticeEvent |
        IncreaseNoticeEvent |
        UploadNoticeEvent>
    notice$group_upload: Listener<UploadNoticeEvent>
    notice$group_admin: Listener<AdminNoticeEvent>
    notice$group_admin$set: Listener<AdminNoticeEvent<'set'>>
    notice$group_admin$unset: Listener<AdminNoticeEvent<'unset'>>
    notice$group_decrease: Listener<DecreaseNoticeEvent>
    notice$group_decrease$leave: Listener<DecreaseNoticeEvent<'leave'>>
    notice$group_decrease$kick: Listener<DecreaseNoticeEvent<'kick'>>
    notice$group_decrease$kick_me: Listener<DecreaseNoticeEvent<'kick_me'>>
    notice$group_increase: Listener<IncreaseNoticeEvent>
    notice$group_increase$approve: Listener<IncreaseNoticeEvent<'approve'>>
    notice$group_increase$invite: Listener<IncreaseNoticeEvent<'invite'>>
    notice$group_ban: Listener<BanNoticeEvent>
    notice$group_ban$ban: Listener<BanNoticeEvent<'ban'>>
    notice$group_ban$lift_ban: Listener<BanNoticeEvent<'lift_ban'>>
    notice$friend_add: Listener<FriendNoticeEvent>
    request: Listener<FriendRequestEvent | GroupRequestEvent>
    request$friend: Listener<FriendRequestEvent>
    request$group: Listener<GroupRequestEvent>
    request$group$add: Listener<GroupRequestEvent<'add'>>
    request$group$invite: Listener<GroupRequestEvent<'invite'>>
    meta_event: Listener<LifecycleMetaEvent | HeartbeatMetaEvent>
    meta_event$lifecycle: Listener<LifecycleMetaEvent>
    meta_event$lifecycle$enable: Listener<LifecycleMetaEvent<'enable'>>
    meta_event$lifecycle$disable: Listener<LifecycleMetaEvent<'disable'>>
    meta_event$heartbeat: Listener<HeartbeatMetaEvent>
}>

const parseMsg = (x: any) => {
    const eventType =
        (x as MessageEvent).message_type ??
        (x as NoticeEvent).notice_type ??
        (x as RequestEvent).request_type ??
        (x as MetaEvent).meta_event_type
    x.types = [
        '*',
        x.post_type,
        x.post_type + '$' + eventType as EventName
    ]
    if ('sub_type' in x)
        x.types.push(x.post_type + '$' + eventType + '$' + x.sub_type)
    return x as EventBase
}

/** Create an `EventEmitter` that receives posts from CQHTTP */
export const Receive = (port: number, secret?: string) => {
    const emitter: ReceiveObject = new EventEmitter()
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
        const parsedMsg: EventBase = parseMsg(jsonMsg)
        parsedMsg.types.forEach(x => emitter.emit(x, parsedMsg as any))
        return endResponse(res, 200)
    }).listen(port)
    return emitter
}
