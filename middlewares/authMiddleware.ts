import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/share/:path*",
];
const LOGIN_PAGE = "/login";

const isPublicPath = (path: string): boolean => PUBLIC_PATHS.includes(path);

const getTokenFromCookies = (request: NextRequest): string | null => {
  return request.cookies.get("accessToken")?.value || null;
};

export function authMiddleware(
  request: NextRequest,
  callBack?: (request: NextRequest) => NextResponse | void,
) {
  const path = request.nextUrl.pathname;
  const token = getTokenFromCookies(request);

  if (token && isPublicPath(path)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!token && !isPublicPath(path)) {
    const redirectUrl = new URL(LOGIN_PAGE, request.url);
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  return callBack?.(request);
}
