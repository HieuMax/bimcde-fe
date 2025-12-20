import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];
const LOGIN_PAGE = "/login";

const isPublicPath = (path: string): boolean => PUBLIC_PATHS.includes(path);

const getTokenFromCookies = (request: NextRequest): string | null => {
  return request.cookies.get("accessToken")?.value || null;
};

export function authMiddleware(request: NextRequest) {
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

  // Nếu token hợp lệ và trang yêu cầu xác thực, cho phép tiếp tục yêu cầu
  return NextResponse.next();
}
