// Why not user.ts に置く: user.ts は "use server" ファイルで、async 関数以外の
// 値 export（定数・型）が許されないため、ページング用の型と定数はここに切り出す。

// タイムラインが一度に返す投稿件数の上限。フォロー数 × 投稿数に比例して結果が伸びる
// 最も件数の膨らみやすいクエリのため、上限を設けて全件取得を止める。
export const TIMELINE_PAGE_SIZE = 20;

// client → Server Action の引数として往復するカーソル。bigint を引数に直接渡す設計を避けるため
// 投稿 id（主キー）を文字列化して受け渡す（action 内で BigInt へ戻す）。
export type TimelineCursor = {
	id: string;
};

export type TimelinePostsResult = {
	posts: {
		id: bigint;
		body: string;
		createdAt: Date;
		likeCount: number;
		isLikedByCurrentUser: boolean;
		user: {
			id: string;
			nickname: string;
			profileImageUrl: string | null;
		};
		images: { id: bigint; url: string }[];
		bar: {
			id: bigint;
			name: string;
			prefecture: string;
			city: string;
		};
	}[];
	nextCursor: TimelineCursor | null;
};
