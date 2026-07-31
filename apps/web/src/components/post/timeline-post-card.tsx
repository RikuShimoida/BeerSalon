import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import { LikeButton } from "./like-button";

type TimelinePost = {
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
	images: {
		id: bigint;
		url: string;
	}[];
	bar: {
		id: bigint;
		name: string;
		prefecture: string;
		city: string;
	};
};

type TimelinePostCardProps = {
	post: TimelinePost;
};

function PostImages({ images }: { images: TimelinePost["images"] }) {
	if (images.length === 0) {
		return null;
	}

	if (images.length === 1) {
		return (
			<div className="relative aspect-[4/3] overflow-hidden rounded-xl">
				<Image
					src={images[0].url}
					alt=""
					fill
					className="object-cover"
					sizes="(max-width: 768px) 100vw, 600px"
				/>
			</div>
		);
	}

	if (images.length === 2) {
		return (
			<div className="grid grid-cols-2 gap-1.5">
				{images.map((image) => (
					<div
						key={image.id}
						className="relative aspect-square overflow-hidden rounded-xl"
					>
						<Image
							src={image.url}
							alt=""
							fill
							className="object-cover"
							sizes="(max-width: 768px) 50vw, 300px"
						/>
					</div>
				))}
			</div>
		);
	}

	// Why not 3枚も等分グリッド: デザイン（2fr:1fr 分割）に倣い、先頭を大きく、残りを縦積みにして
	// 投稿写真の主役を明確にする。3枚は左1大 + 右2縦、4枚は左1大 + 右3縦。5枚以上渡っても先頭4枚のみ。
	const [first, ...rest] = images;
	return (
		<div className="grid grid-cols-[2fr_1fr] gap-1.5">
			<div className="relative aspect-square overflow-hidden rounded-xl">
				<Image
					src={first.url}
					alt=""
					fill
					className="object-cover"
					sizes="(max-width: 768px) 66vw, 400px"
				/>
			</div>
			<div className="grid grid-rows-3 gap-1.5">
				{rest.slice(0, 3).map((image) => (
					<div key={image.id} className="relative overflow-hidden rounded-xl">
						<Image
							src={image.url}
							alt=""
							fill
							className="object-cover"
							sizes="(max-width: 768px) 33vw, 200px"
						/>
					</div>
				))}
			</div>
		</div>
	);
}

export function TimelinePostCard({ post }: TimelinePostCardProps) {
	return (
		<article className="bg-card rounded-2xl border border-primary/15 shadow-lg overflow-hidden">
			<div className="p-4 md:p-5">
				<div className="flex items-center gap-3 mb-4">
					<Link
						href={`/users/${post.user.id}`}
						className="flex-shrink-0"
						aria-label={`${post.user.nickname}のプロフィール`}
					>
						<div className="w-11 h-11 rounded-full overflow-hidden border border-primary/30 bg-gradient-to-br from-primary to-primary-strong flex items-center justify-center">
							{post.user.profileImageUrl ? (
								<Image
									src={post.user.profileImageUrl}
									alt=""
									width={44}
									height={44}
									className="w-full h-full object-cover"
								/>
							) : (
								<span className="text-lg font-semibold text-primary-foreground">
									{post.user.nickname.charAt(0)}
								</span>
							)}
						</div>
					</Link>
					<div className="flex flex-col">
						<Link
							href={`/users/${post.user.id}`}
							className="text-heading font-semibold hover:text-primary transition-colors"
						>
							{post.user.nickname}
						</Link>
						<time
							dateTime={post.createdAt.toISOString()}
							className="text-xs text-subtext"
						>
							{formatRelativeTime(post.createdAt)}
						</time>
					</div>
				</div>

				{post.images.length > 0 && (
					<div className="mb-4">
						<PostImages images={post.images} />
					</div>
				)}

				<p className="text-card-foreground mb-4 whitespace-pre-wrap leading-relaxed">
					{post.body}
				</p>

				<div className="flex items-center justify-between gap-3">
					<Link
						href={`/bars/${post.bar.id}`}
						className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors max-w-[70%]"
					>
						<MapPin className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
						<span className="truncate">{post.bar.name}</span>
					</Link>
					<LikeButton
						postId={post.id}
						initialLikeCount={post.likeCount}
						initialIsLiked={post.isLikedByCurrentUser}
					/>
				</div>
			</div>
		</article>
	);
}
