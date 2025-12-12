import { NextResponse } from 'next/server';

export function proxy(request) {
  const url = request.nextUrl.clone();

  if (url.pathname.startsWith('/_next/static/chunks/wasm/')) {
    const file = url.pathname.replace('/_next/static/chunks/wasm/', '');
    url.pathname = `/wasm/${file}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/_next/static/chunks/wasm/:path*',
  ],
};
