import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

// Why not: Inbucket ではなく Mailpit を使う。supabase v2 系のローカルスタックは
// メール受信UIが Mailpit（54424）に変わっており、API も /api/v1 系で統一されている。
const MAILPIT_BASE_URL =
	process.env.MAILPIT_BASE_URL ?? "http://127.0.0.1:54424";

type MailpitMessageSummary = {
	ID: string;
	Subject: string;
	To: { Address: string }[];
};

async function findConfirmationMessage(
	recipient: string,
): Promise<MailpitMessageSummary | null> {
	const res = await fetch(`${MAILPIT_BASE_URL}/api/v1/messages`);
	if (!res.ok) {
		throw new Error(`Mailpit messages API failed: ${res.status}`);
	}
	const body = (await res.json()) as { messages: MailpitMessageSummary[] };
	return (
		body.messages.find((m) =>
			m.To.some((to) => to.Address.toLowerCase() === recipient.toLowerCase()),
		) ?? null
	);
}

async function getMessageHtml(messageId: string): Promise<string> {
	const res = await fetch(`${MAILPIT_BASE_URL}/api/v1/message/${messageId}`);
	if (!res.ok) {
		throw new Error(`Mailpit message API failed: ${res.status}`);
	}
	const body = (await res.json()) as { HTML?: string; Text?: string };
	return `${body.HTML ?? ""}${body.Text ?? ""}`;
}

test.describe("新規登録ページ", () => {
	test("メールアドレスとパスワードの入力欄が表示される", async ({ page }) => {
		await page.goto("/signup");

		await expect(page.locator('input[name="email"]')).toBeVisible();
		await expect(page.locator('input[name="password"]')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	// Why not: 「確認メールが届く」検証はブラウザ操作とメールサーバー受信の統合動作であり
	// UT では再現できないため E2E で担保する（Issue #275 の再発防止の核）。
	test("登録すると確認メールが登録アドレス宛に届き、リンクから /signup/profile へ到達できる", async ({
		page,
	}) => {
		const email = faker.internet.email().toLowerCase();
		const password = "Test1234!@#";

		await page.goto("/signup");
		await page.fill('input[name="email"]', email);
		await page.fill('input[name="password"]', password);
		await page.click('button[type="submit"]');

		await page.waitForURL("/signup?success=true");

		await expect
			.poll(async () => (await findConfirmationMessage(email)) !== null, {
				timeout: 15000,
				message: "確認メールが Mailpit に届くこと",
			})
			.toBe(true);

		const confirmed = await findConfirmationMessage(email);
		if (confirmed === null) {
			throw new Error("確認メールが見つかりませんでした");
		}
		expect(confirmed.Subject).toContain("メールアドレス確認");

		const html = await getMessageHtml(confirmed.ID);
		const callbackLink = html.match(
			/https?:\/\/[^"\s<>]+\/auth\/callback\?[^"\s<>]+/,
		)?.[0];
		expect(
			callbackLink,
			"メール本文に /auth/callback リンクが含まれること",
		).toBeTruthy();
		expect(callbackLink).toContain("type=signup");
		expect(callbackLink).toContain("next=/signup/profile");

		// Why not: メール内リンクはホスト名がリクエスト由来（127.0.0.1 等）になりうるため、
		// baseURL と揃えてパス＋クエリのみで遷移し、E2E のホスト差異に左右されないようにする。
		const linkUrl = new URL(callbackLink as string);
		await page.goto(`${linkUrl.pathname}${linkUrl.search}`);

		await page.waitForURL("/signup/profile");
		await expect(
			page.getByRole("heading", { name: "プロフィール入力" }),
		).toBeVisible();
	});
});
