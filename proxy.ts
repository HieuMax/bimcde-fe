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
  } else if (url.pathname.startsWith('/ROOT/node_modules/web-ifc-three/node_modules/web-ifc/')) {
    const file = url.pathname.replace('/ROOT/node_modules/web-ifc-three/node_modules/web-ifc/', '');
    url.pathname = `${file}`;
    return NextResponse.rewrite(url);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)",
    '/_next/static/chunks/wasm/:path*',
    '/ROOT/node_modules/web-ifc-three/node_modules/web-ifc/wasm/:path*',
  ],
};
