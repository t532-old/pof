import { post } from 'httpie'
import { URL } from 'url'
import { flipOut, merge, kvFilter, Extensive } from './util'
import { Code, template } from './code'
import { raw, MaybeRaw } from './interface'

export type ApiName =
    'send_private_msg' | 'send_group_msg' | 'send_discuss_msg' | 'send_msg' | 'delete_msg' | 'send_like' |
    'set_group_kick' | 'set_group_ban' | 'set_group_anonymous_ban' | 'set_group_whole_ban' |
    'set_group_admin' | 'set_group_anonymous' | 'set_group_card' | 'set_group_leave' | 'set_group_special_title' |
    'set_discuss_leave' | 'set_friend_add_request' | 'set_group_add_request' |
    'get_login_info' | 'get_stranger_info' | 'get_friend_list' |
    'get_group_list' | 'get_group_info' | 'get_group_member_info' | 'get_group_member_list' |
    'get_credentials' | 'get_record' | 'get_image' |
    'can_send_image' | 'can_send_record' | 'get_status' | 'get_version_info' |
    'set_restart_plugin' | 'clean_data_dir' | 'clean_plugin_log'

export const endpoint =
    (url: string, apiKey?: string) =>
    <T, R>(apiName: ApiName, keys?: string) =>
    (...data: MaybeRaw<Extensive<Partial<T>>>[]) => post(
        new URL(apiName, url), {
        headers: apiKey ? {authorization: `Bearer ${apiKey}`} : {},
        body: kvFilter(merge(data.map(raw)))(([k]) => 
            keys?.split(' ').includes(k) ?? true),
    }).then(res =>
        flipOut(res.data, 'data') as ResponseBase<R>)

export type ResponseBase<T> = T & {$status: 'ok' | 'failed', $retcode: number}
export type Ep<T, R> = (...data: Extensive<Partial<T>>[]) => Promise<ResponseBase<R>>

export type NullResponse = {}
export type FileResponse = {file: string}
export type BinaryResponse = {yes: boolean}
export type SendMsgResponse = {message_id: number}
export type GetLoginInfoResponse = {user_id: number, nickname: string}
export type GetStrangerInfoResponse = GetLoginInfoResponse & {sex: 'male' | 'female' | 'unkown', age: number}
export type GetFriendInfoResponse = GetLoginInfoResponse & {remark: string}
export type GetGroupInfoBriefResponse = {group_id: number, group_name: string}
export type GetGroupInfoResponse = GetGroupInfoBriefResponse & {member_count: number, max_member_count: number}
export type GetGroupMemberInfoResponse = GetStrangerInfoResponse & {
    group_id: string
    card: string
    area: string
    join_time: number
    lasts_sent_time: number
    level: string
    role: 'owner' | 'admin' | 'member'
    unfriendly: boolean
    title: string
    title_expire_time: number
    card_changeable: boolean
}
export type GetCredentialsResponse = {
    cookies: string
    csrf_token: number
}
export type GetStatusResponse = {
    app_initialized: boolean
    app_enabled: boolean
    plugins_good: object
    app_good: boolean
    online?: boolean
    good: boolean
}
export type GetVersionInfoResponse = {
    coolq_directory: string
    coolq_edition: string
    plugin_version: string
    plugin_build_number: number
    plugin_build_configuration: string
}

export type SendMsgBaseRequest = {
    message: string | Code[]
    auto_escape?: boolean
}
export type UserRequest = {user_id: number}
export type GroupRequest = {group_id: number}
export type DiscussRequest = {discuss_id: number}
export type SendPrivateMsgRequest = SendMsgBaseRequest & UserRequest
export type SendGroupMsgRequest = SendMsgBaseRequest & GroupRequest
export type SendDiscussMsgRequest = SendMsgBaseRequest & DiscussRequest
export type SendMsgRequest = SendMsgBaseRequest & (
    (Partial<UserRequest> & {message_type?: 'private'}) |
    (Partial<GroupRequest> & {message_type?: 'group'}) |
    (Partial<DiscussRequest> & {message_type?: 'discuss'}))
export type DeleteMsgRequest = {message_id: number}
export type SendLikeRequest = UserRequest & {times?: number}
export type SetGroupKickRequest = GroupRequest & UserRequest & {reject_add_request?: boolean}
export type SetGroupBanRequest = GroupRequest & UserRequest & {duration?: number}
export type SetGroupAnonymousBanRequest = GroupRequest & {anonymous?: object, anonymous_flag?: string, duration?: number}
export type SetGroupWholeBanRequest = GroupRequest & {enable?: boolean}
export type SetGroupAdminRequest = GroupRequest & UserRequest & {enable?: boolean}
export type SetGroupAnonymousRequest = GroupRequest & {enable?: boolean}
export type SetGroupCardRequest = GroupRequest & UserRequest & {card: string}
export type SetGroupLeaveRequest = GroupRequest & {is_dismiss?: boolean}
export type SetGroupSpecialTitleRequest = GroupRequest & UserRequest & {special_title?: string}
export type SetAddRequestRequest = {flag: string, approve?: boolean}
export type SetFriendAddRequestRequest = SetAddRequestRequest & {remark?: string}
export type SetGroupAddRequestRequest = SetAddRequestRequest & {sub_type: 'add' | 'invite', reason?: string}
export type SetDiscussLeaveRequest = DiscussRequest
export type GetStrangerInfoRequest = UserRequest & {no_cache?: boolean}
export type GetGroupInfoRequest = GroupRequest & {no_cache?: boolean}
export type GetGroupMemberInfoRequest = GroupRequest & UserRequest & {no_cache?: boolean}
export type GetGroupMemberListRequest = GroupRequest
export type RecordFormat = 'mp3' | 'amr' | 'wma' | 'm4a' | 'spx' | 'ogg' | 'wav' | 'flac'
export type GetRecordRequest = {file: string, out_format: RecordFormat, full_path?: boolean}
export type GetImageRequest = {file: string}
export type SetRestartPluginRequest = {delay: string}
export type DataDirectory = 'image' | 'record' | 'show' | 'bface'
export type CleanDataDirRequest = {data_dir: DataDirectory}

export const Send = (url: string, apiKey?: string) => {
    const ep = endpoint(url, apiKey)
    return {
        send: (msg: Extensive<MaybeRaw<SendMsgRequest>>) => (...frags: Parameters<typeof template>) =>
            ep<SendMsgRequest, SendMsgResponse>(
                'send_msg', 'message_type group_id user_id message auto_escape')(
                msg, {message: template(...frags)}),
        call: ep,
        sendPrivateMsg: <Ep<SendPrivateMsgRequest, SendMsgResponse>> ep
            ('send_private_msg', 'user_id message auto_escape'),
        sendGroupMsg: <Ep<SendGroupMsgRequest, SendMsgResponse>> ep
            ('send_group_msg', 'group_id message auto_escape'),
        sendDiscussMsg: <Ep<SendDiscussMsgRequest, SendMsgResponse>> ep
            ('send_discuss_msg', 'discuss_id message auto_escape'),
        sendMsg: <Ep<SendMsgRequest, SendMsgResponse>> ep
            ('send_msg', 'message_type group_id user_id discuss_id message auto_escape'),
        deleteMsg: <Ep<DeleteMsgRequest, NullResponse>> ep
            ('delete_msg', 'message_id'),
        sendLike: <Ep<SendLikeRequest, NullResponse>> ep
            ('send_like', 'user_id times'),
        setGroupKick: <Ep<SetGroupKickRequest, NullResponse>> ep
            ('set_group_kick', 'user_id group_id reject_add_request'),
        setGroupBan: <Ep<SetGroupBanRequest, NullResponse>> ep
            ('set_group_ban', 'user_id group_id duration'),
        setGroupAnonymousBan: <Ep<SetGroupAnonymousBanRequest, NullResponse>> ep
            ('set_group_anonymous_ban', 'group_id anonymous anonymous_flag duration'),
        setGroupWholeBan: <Ep<SetGroupWholeBanRequest, NullResponse>> ep
            ('set_group_whole_ban', 'group_id enable'),
        setGroupAdmin: <Ep<SetGroupAdminRequest, NullResponse>> ep
            ('set_group_admin', 'group_id user_id enable'),
        setGroupAnonymous: <Ep<SetGroupAnonymousRequest, NullResponse>> ep
            ('set_group_anonymous', 'group_id enable'),
        setGroupCard: <Ep<SetGroupCardRequest, NullResponse>> ep
            ('set_group_card', 'group_id user_id card'),
        setGroupLeave: <Ep<SetGroupLeaveRequest, NullResponse>> ep
            ('set_group_leave', 'group_id dismiss'),
        setGroupSpecialTitle: <Ep<SetGroupSpecialTitleRequest, NullResponse>> ep
            ('set_group_special_title', 'group_id user_id special_title'),
        setFriendAddRequest: <Ep<SetFriendAddRequestRequest, NullResponse>> ep
            ('set_friend_add_request', 'flag approve remark'),
        setGroupAddRequest: <Ep<SetGroupAddRequestRequest, NullResponse>> ep
            ('set_group_add_request', 'flag sub_type approve reason'),
        getLoginInfo: <Ep<null, GetLoginInfoResponse>> ep
            ('get_login_info', ''),
        getStrangerInfo: <Ep<GetStrangerInfoRequest, GetStrangerInfoResponse>> ep
            ('get_stranger_info', 'user_id no_cache'),
        getFriendList: <Ep<null, GetFriendInfoResponse[]>> ep
            ('get_friend_list', ''),
        getGroupList: <Ep<null, GetGroupInfoBriefResponse[]>> ep
            ('get_group_list', ''),
        getGroupInfo: <Ep<GetGroupInfoRequest, GetGroupInfoResponse>> ep
            ('get_group_info', 'group_id no_cache'),
        getGroupMemberInfo: <Ep<GetGroupMemberInfoRequest, GetGroupMemberInfoResponse>> ep
            ('get_group_member_info', 'group_id user_id no_cache'),
        getGroupMemberList: <Ep<GetGroupMemberListRequest, Partial<GetGroupMemberInfoResponse>[]>> ep
            ('get_group_member_list', 'group_id'),
        getCredentials: <Ep<null, GetCredentialsResponse>> ep
            ('get_credentials', ''),
        getRecord: <Ep<GetRecordRequest, FileResponse>> ep
            ('get_record', 'file out_format full_path'),
        getImage: <Ep<GetImageRequest, FileResponse>> ep
            ('get_image', 'file'),
        canSendImage: <Ep<null, BinaryResponse>> ep
            ('can_send_image', ''),
        canSendRecord: <Ep<null, BinaryResponse>> ep
            ('can_send_record', ''),
        getStatus: <Ep<null, GetStatusResponse>> ep
            ('get_status', ''),
        getVersionInfo: <Ep<null, GetVersionInfoResponse>> ep
            ('get_version_info', ''),
        setRestartPlugin: <Ep<SetRestartPluginRequest, NullResponse>> ep
            ('set_restart_plugin', 'delay'),
        cleanDataDir: <Ep<CleanDataDirRequest, NullResponse>> ep
            ('clean_data_dir', 'data_dir'),
        cleanPluginLog: <Ep<null, NullResponse>> ep
            ('clean_plugin_log', ''),
    }
}
