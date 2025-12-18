"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createPostSchema } from "@/lib/validations/post";

type FormState = {
	error?: string;
	barId?: string;
};

export async function createPost(
	_prevState: FormState | undefined,
	formData: FormData,
): Promise<FormState | undefined> {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return {
			error: "認証が必要です",
		};
	}

	const userProfile = await prisma.userProfile.findUnique({
		where: { userAuthId: user.id },
	});

	if (!userProfile) {
		return {
			error: "ユーザープロフィールが見つかりません",
		};
	}

	const barId = formData.get("barId") as string;
	const body = formData.get("body") as string;

	const images: File[] = [];
	for (let i = 0; i < 4; i++) {
		const image = formData.get(`image-${i}`) as File | null;
		if (image && image instanceof File && image.size > 0) {
			images.push(image);
		}
	}

	const data = {
		barId,
		body,
		images,
	};

	const result = createPostSchema.safeParse(data);
	if (!result.success) {
		return {
			error: result.error.issues[0].message,
			barId,
		};
	}

	try {
		const post = await prisma.post.create({
			data: {
				userId: userProfile.id,
				barId: result.data.barId,
				body: result.data.body,
			},
		});

		if (result.data.images && result.data.images.length > 0) {
			for (let i = 0; i < result.data.images.length; i++) {
				const image = result.data.images[i];
				const fileExt = image.name.split(".").pop();
				const fileName = `${crypto.randomUUID()}.${fileExt}`;
				const filePath = `posts/${post.id}/${fileName}`;

				const arrayBuffer = await image.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);

				const { error: uploadError } = await supabase.storage
					.from("post-images")
					.upload(filePath, buffer, {
						contentType: image.type,
					});

				if (uploadError) {
					console.error("画像アップロードエラー:", uploadError);
					continue;
				}

				const {
					data: { publicUrl },
				} = supabase.storage.from("post-images").getPublicUrl(filePath);

				await prisma.postImage.create({
					data: {
						postId: post.id,
						imageUrl: publicUrl,
						sortOrder: i,
					},
				});
			}
		}
	} catch (error) {
		console.error("投稿作成エラー:", error);
		return {
			error: "投稿の作成に失敗しました",
			barId,
		};
	}

	redirect(`/bars/${result.data.barId}`);
}
