import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "voom_session";

export function middleware(request: NextRequest) {
	if (request.nextUrl.pathname.startsWith("/record")) {
		const session = request.cookies.get(SESSION_COOKIE_NAME);
		if (!session?.value) {
			return NextResponse.redirect(new URL("/", request.url));
		}
	}
	return NextResponse.next();
}

export const config = {
	matcher: ["/record", "/record/:path*"],
};
