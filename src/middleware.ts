import { type NextRequest, NextResponse } from "next/server";

// Define public routes that don't require authentication
const publicRoutes = ["/login", "/register", "/"];
const publicApiRoutes = ["/api/auth"];

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Check if the route is public
	const isPublicRoute = publicRoutes.some(
		(route) => pathname === route || pathname.startsWith(`${route}/`),
	);
	const isPublicApiRoute = publicApiRoutes.some((route) => {
		return pathname.startsWith(route);
	});

	// Allow public routes
	if (isPublicRoute || isPublicApiRoute) {
		return NextResponse.next();
	}

	// Check for session cookie
	const sessionCookie = request.cookies.get("better-auth.session_token");

	// If no session and trying to access protected route, redirect to login
	if (!sessionCookie) {
		const loginUrl = new URL("/login", request.url);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!_next/static|_next/image|favicon.ico).*)",
	],
};
