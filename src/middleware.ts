import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSIONE, tokenValido } from "@/lib/auth";

// Blocca tutte le pagine finché non si entra con la password.
export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_SESSIONE)?.value;
  if (await tokenValido(token)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/accesso";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Tutto tranne la pagina di accesso e i file statici di Next.js.
  matcher: ["/((?!accesso(?:/|$)|_next/static|_next/image|favicon.ico).*)"],
};
