/**
 * Mailpit API helper for E2E tests
 * Supabase local development uses Mailpit for email testing
 */

const MAILPIT_API_URL = "http://127.0.0.1:54324/api/v1";

interface MailpitMessage {
	ID: string;
	From: { Address: string };
	To: Array<{ Address: string }>;
	Subject: string;
	Created: string;
}

interface MailpitMessagesResponse {
	messages: MailpitMessage[];
	total: number;
}

/**
 * Wait for an email to arrive in Mailpit
 */
export async function waitForEmail(
	toEmail: string,
	options: {
		timeout?: number;
		pollInterval?: number;
		subject?: string;
	} = {},
): Promise<MailpitMessage> {
	const { timeout = 30000, pollInterval = 1000, subject } = options;
	const startTime = Date.now();

	while (Date.now() - startTime < timeout) {
		const response = await fetch(`${MAILPIT_API_URL}/messages`);
		if (!response.ok) {
			throw new Error(`Failed to fetch emails: ${response.statusText}`);
		}

		const data = (await response.json()) as MailpitMessagesResponse;

		const email = data.messages?.find((msg) => {
			const matchesRecipient = msg.To.some((to) => to.Address === toEmail);
			const matchesSubject = subject ? msg.Subject.includes(subject) : true;
			return matchesRecipient && matchesSubject;
		});

		if (email) {
			return email;
		}

		await new Promise((resolve) => setTimeout(resolve, pollInterval));
	}

	throw new Error(
		`Email to ${toEmail}${subject ? ` with subject "${subject}"` : ""} not received within ${timeout}ms`,
	);
}

/**
 * Get email content (HTML or text)
 */
export async function getEmailContent(
	messageId: string,
): Promise<{ html: string; text: string }> {
	const response = await fetch(`${MAILPIT_API_URL}/message/${messageId}`);
	if (!response.ok) {
		throw new Error(`Failed to fetch email content: ${response.statusText}`);
	}

	const data = await response.json();
	return {
		html: data.HTML || "",
		text: data.Text || "",
	};
}

/**
 * Extract confirmation link from Supabase email
 */
export function extractConfirmationLink(htmlContent: string): string | null {
	const linkMatch = htmlContent.match(
		/href="([^"]*\/auth\/(?:v1\/verify|confirm)[^"]*)"/,
	);
	if (linkMatch?.[1]) {
		return linkMatch[1].replace(/&amp;/g, "&");
	}

	const urlMatch = htmlContent.match(
		/(https?:\/\/[^\s<>"]+\/auth\/(?:v1\/verify|confirm)[^\s<>"]*)/,
	);
	return urlMatch?.[1] || null;
}

/**
 * Delete all emails from Mailpit
 */
export async function deleteAllEmails(): Promise<void> {
	await fetch(`${MAILPIT_API_URL}/messages`, { method: "DELETE" });
}
