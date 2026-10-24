import "server-only";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL;

// Why not モジュール初期化時に throw: API キー未設定でもアプリ全体を落とさない。
// 実際にメール送信を試みたときだけ失敗させ、ログインなど無関係な機能を巻き込まない。
function getResendClient(): Resend | null {
	if (!resendApiKey) return null;
	return new Resend(resendApiKey);
}

export async function sendAdminPasswordResetEmail(params: {
	to: string;
	resetUrl: string;
}): Promise<void> {
	const client = getResendClient();
	if (!client || !fromEmail) {
		// 送信基盤が未設定の環境(ローカル/未構成の preview)では送信をスキップする。
		// 呼び出し側は列挙対策のため成否に関わらず同一メッセージを返すため、ここでは例外にしない。
		console.warn(
			"[email] RESEND_API_KEY or RESEND_FROM_EMAIL is not set. Skipping password reset email.",
		);
		return;
	}

	await client.emails.send({
		from: fromEmail,
		to: params.to,
		subject: "【Beer Salon Admin】パスワード再設定のご案内",
		text: [
			"Beer Salon Admin のパスワード再設定のリクエストを受け付けました。",
			"",
			"以下のリンクから新しいパスワードを設定してください（有効期限: 1時間）。",
			params.resetUrl,
			"",
			"このメールに心当たりがない場合は、破棄してください。",
		].join("\n"),
	});
}
