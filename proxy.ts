import type { NextRequest } from "next/server";
import { authMiddleware } from "./middlewares/authMiddleware";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  // AuthMiddleware
  const authResult = authMiddleware(request);
  if (authResult) return authResult;

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
