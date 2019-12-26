import { Code } from './code'

export const ApiInference = {
    send_private_msg: ['user_id'],
    send_group_msg: ['group_id'],
    send_msg: [],
    delete_msg: ['message_id'],
    send_like: ['user_id'],
    set_group_kick: ['group_id', 'user_id'],
    set_group_ban: ['group_id', 'user_id'],
    set_group_anonymous_ban: ['group_id', 'anonymous'],
    set_group_whole_ban: ['group_id'],
    set_group_admin: ['group_id', 'user_id'],
    set_group_anonymous: ['group_id'],
    set_group_card: ['group_id', 'user_id'],
    set_group_leave: ['group_id'],
    set_group_special_title: ['group_id', 'user_id'],
    set_friend_add_request: ['flag'],
    set_group_add_request: ['flag', 'sub_type'],
    get_login_info: [],
    get_stranger_info: ['user_id'],
    get_friend_list: [],
    get_group_list: [],
    get_group_info: ['group_id'],
    get_group_member_info: ['group_id', 'user_id'],
    get_group_member_list: ['group_id'],
    get_credentials: [],
    get_record: [],
    get_image: [],
    can_send_image: [],
    can_send_record: [],
    get_status: [],
    get_version_info: [],
    set_restart_plugin: [],
    clean_data_dir: [],
    clean_plugin_log: [],
}

type ApiResponse<T> = T & { $status: 'ok' | 'failed', $retcode: number }

type Api<Q, R> = (x: Q) => Promise<ApiResponse<R>>
type NullApi<Q = {}> = Api<Q, null>
type NullDurationApi = NullApi<{ duration?: number }>
type NullBinaryApi = NullApi<{ enable?: boolean }>
type EmptyApi<R = null> = Api<{}, R>
type CachedApi<R> = Api<{ no_cache?: boolean }, R>
type EmptyBinaryApi = EmptyApi<{ yes: boolean }>
type MessageApi = Api<{ message: Code[] | String, no_cache?: boolean }, { message_id: number }>

type LoginInfo = { user_id: number, nickname: string }
type StrangerInfo = LoginInfo & { sex: 'male' | 'female' | 'unkown', age: number }
type FriendInfo = LoginInfo & { remark: string }
type BriefGroupInfo = { group_id: number, group_name: string }
type GroupInfo = BriefGroupInfo & { member_count: number, max_member_count: number }
type MemberInfo = StrangerInfo & {
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
type PluginStatus = {
    app_initialized: boolean
    app_enabled: boolean
    plugins_good: object
    app_good: boolean
    online?: boolean
    good: boolean
}
type VersionInfo = {
    coolq_directory: string
    coolq_edition: string
    plugin_version: string
    plugin_build_number: number
    plugin_build_configuration: string
}

export type ApiObject = {
    send_private_msg: MessageApi
    send_group_msg: MessageApi
    send_msg: Api<object, { message_id: number }>
    delete_msg: NullApi
    send_like: NullApi<{ times: number }>
    set_group_kick: NullApi<{ reject_add_request?: boolean }>
    set_group_ban: NullDurationApi
    set_group_anonymous_ban: NullDurationApi
    set_group_whole_bacn: NullBinaryApi
    set_group_admin: NullBinaryApi
    set_group_anonymous: NullBinaryApi
    set_group_card: NullApi<{ card?: string }>
    set_group_leave: NullApi<{ is_dismiss?: string }>
    set_group_special_title: NullApi<{ special_title?: string }>
    set_friend_add_request: NullApi<{ approve?: boolean, remark?: string }>
    set_group_add_request: NullApi<{ approve?: boolean, reason?: string }>
    get_login_info: EmptyApi<LoginInfo>
    get_stranger_info: CachedApi<StrangerInfo>
    get_friend_list: EmptyApi<FriendInfo[]>
    get_group_list: EmptyApi<BriefGroupInfo[]>
    get_group_info: CachedApi<GroupInfo>
    get_group_member_info: CachedApi<MemberInfo>
    get_group_member_list: EmptyApi<MemberInfo[]>
    get_credentials: EmptyApi<{ cookies: string, csrf_token: number }>
    get_record: Api<{ file: string, out_format: string, full_path?: boolean }, { file: string }>
    get_image: Api<{ file: string }, { file: string }>
    can_send_image: EmptyBinaryApi
    can_send_record: EmptyBinaryApi
    get_status: EmptyApi<PluginStatus>
    get_version_info: EmptyApi<VersionInfo>
    set_restart_plugin: NullApi<{ delay?: number }>
    clean_data_dir: NullApi<{ data_dir: string }>
    clean_plugin_log: NullApi
}
