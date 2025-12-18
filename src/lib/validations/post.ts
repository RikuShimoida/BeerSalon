import { z } from "zod";

const MAX_IMAGES = 4;

export const createPostSchema = z.object({
	barId: z
		.string()
		.min(1, { message: "店舗を選択してください" })
		.transform((val) => BigInt(val)),
	body: z.string().min(1, { message: "投稿本文を入力してください" }),
	images: z
		.array(z.instanceof(File))
		.max(MAX_IMAGES, { message: `写真は最大${MAX_IMAGES}枚までです` })
		.optional()
		.default([]),
});

export type CreatePostFormData = z.infer<typeof createPostSchema>;
