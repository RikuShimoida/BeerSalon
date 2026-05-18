import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import type { AdminUser } from "@/types/database";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
	throw new Error("JWT_SECRET environment variable is not set");
}
const JWT_SECRET = new TextEncoder().encode(jwtSecret);

const TOKEN_NAME = "admin-token";
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 10);
}

export async function verifyPassword(
	password: string,
	hash: string,
): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

export async function createToken(user: AdminUser): Promise<string> {
	const token = await new SignJWT({
		id: user.id,
		barManageId: user.bar_manage_id,
		name: user.name,
		role: user.role,
		barId: user.bar_id,
	})
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("7d")
		.sign(JWT_SECRET);

	return token;
}

export async function verifyToken(token: string) {
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET);
		return payload;
	} catch (_error) {
		return null;
	}
}

export async function setAuthCookie(token: string) {
	const cookieStore = await cookies();
	cookieStore.set(TOKEN_NAME, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: TOKEN_MAX_AGE,
		path: "/",
	});
}

export async function getAuthCookie(): Promise<string | undefined> {
	const cookieStore = await cookies();
	return cookieStore.get(TOKEN_NAME)?.value;
}

export async function removeAuthCookie() {
	const cookieStore = await cookies();
	cookieStore.delete(TOKEN_NAME);
}

export type CurrentUser = {
	id: string;
	barManageId: string;
	name: string;
	role: "bar_owner" | "admin";
	barId: number | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
	const token = await getAuthCookie();
	if (!token) return null;

	const payload = await verifyToken(token);
	if (!payload) return null;

	return {
		id: payload.id as string,
		barManageId: payload.barManageId as string,
		name: payload.name as string,
		role: payload.role as "bar_owner" | "admin",
		barId: (payload.barId as number | null) ?? null,
	};
}

export function canAccessBar(
	user: CurrentUser,
	barId: string | number,
): boolean {
	if (user.role === "admin") return true;
	return user.barId === Number(barId);
}
