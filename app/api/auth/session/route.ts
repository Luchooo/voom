import { getAdminAuth } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "voom_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { idToken } = body as { idToken?: string };
		if (!idToken || typeof idToken !== "string") {
			return NextResponse.json(
				{ error: "Missing idToken" },
				{ status: 400 },
			);
		}
		const adminAuth = getAdminAuth();
		const decoded = await adminAuth.verifyIdToken(idToken);
		const uid = decoded.uid;

		const response = NextResponse.json({ ok: true });
		response.cookies.set(SESSION_COOKIE_NAME, uid, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: SESSION_MAX_AGE,
			path: "/",
		});
		return response;
	} catch (e) {
		console.error("Session verification failed:", e);
		return NextResponse.json(
			{ error: "Invalid or expired token" },
			{ status: 401 },
		);
	}
}
