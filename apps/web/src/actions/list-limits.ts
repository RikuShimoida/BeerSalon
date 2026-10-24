// Why not "use server" ファイル内に定数を置く: Server Actions ファイルの top-level export は
// 全て async 関数として扱われる制約があるため、共有する上限定数はこの非 "use server" ファイルに切り出す
// （timeline-types.ts と同じ方針）。

export const NOTIFICATION_LIST_LIMIT = 50;
export const FOLLOWING_LIST_LIMIT = 100;
export const FOLLOWER_LIST_LIMIT = 100;
export const COUPON_LIST_LIMIT = 100;
export const FAVORITE_BAR_LIST_LIMIT = 100;
export const VIEW_HISTORY_LIST_LIMIT = 50;
export const USER_POST_LIST_LIMIT = 50;
export const BAR_LIST_LIMIT = 100;
