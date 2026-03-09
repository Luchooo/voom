import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "voom_session";

export async function POST() {
	const response = NextResponse.json({ ok: true });
	response.cookies.set(SESSION_COOKIE_NAME, "", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 0,
		path: "/",
	});
	return response;
}
