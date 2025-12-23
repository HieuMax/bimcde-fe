import type { NextRequest } from "next/server";
import { authMiddleware } from "./middlewares/authMiddleware";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  // AuthMiddleware
  const authResult = authMiddleware(request, loadWasmIfc);
  if (authResult) return authResult;

  return NextResponse.next();
}

function loadWasmIfc(request: NextRequest) {
  const url = request.nextUrl.clone();

  if (url.pathname.startsWith('/_next/static/chunks/wasm/')) {
    const file = url.pathname.replace('/_next/static/chunks/wasm/', '');
    url.pathname = `/wasm/${file}`;
    return NextResponse.rewrite(url);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)",
    '/_next/static/chunks/wasm/:path*'
  ],
};
