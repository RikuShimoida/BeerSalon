export function validateInstagramUrl(url: string | null | undefined): {
	isValid: boolean;
	error?: string;
} {
	if (!url || url.trim() === "") {
		return { isValid: true };
	}

	const instagramUrlPattern = /^https?:\/\/(www\.)?instagram\.com\/.+/i;
	if (!instagramUrlPattern.test(url)) {
		return {
			isValid: false,
			error:
				"Instagram URLの形式が正しくありません。https://instagram.com/ または https://www.instagram.com/ で始まるURLを入力してください",
		};
	}

	return { isValid: true };
}

export function validateXUrl(url: string | null | undefined): {
	isValid: boolean;
	error?: string;
} {
	if (!url || url.trim() === "") {
		return { isValid: true };
	}

	const xUrlPattern = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/i;
	if (!xUrlPattern.test(url)) {
		return {
			isValid: false,
			error:
				"X（Twitter）のURLはhttps://twitter.com/ または https://x.com/ で始まる必要があります",
		};
	}

	return { isValid: true };
}

export function validateFacebookUrl(url: string | null | undefined): {
	isValid: boolean;
	error?: string;
} {
	if (!url || url.trim() === "") {
		return { isValid: true };
	}

	const facebookUrlPattern = /^https:\/\/(www\.|m\.)?facebook\.com\/.+/i;
	if (!facebookUrlPattern.test(url)) {
		return {
			isValid: false,
			error:
				"正しいFacebook URLを入力してください（例: https://www.facebook.com/yourpage）",
		};
	}

	return { isValid: true };
}

export function validateLineUrl(url: string | null | undefined): {
	isValid: boolean;
	error?: string;
} {
	if (!url || url.trim() === "") {
		return { isValid: true };
	}

	const lineUrlPattern = /^https:\/\/.+/i;
	if (!lineUrlPattern.test(url)) {
		return {
			isValid: false,
			error:
				"LINE URLの形式が正しくありません。https:// で始まるURLを入力してください",
		};
	}

	return { isValid: true };
}

export function validateWebsiteUrl(url: string | null | undefined): {
	isValid: boolean;
	error?: string;
} {
	if (!url || url.trim() === "") {
		return { isValid: true };
	}

	const websiteUrlPattern = /^https?:\/\/.+/i;
	if (!websiteUrlPattern.test(url)) {
		return {
			isValid: false,
			error:
				"ホームページURLの形式が正しくありません。http:// または https:// で始まるURLを入力してください",
		};
	}

	return { isValid: true };
}
