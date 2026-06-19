import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["en", "vi", "zh", "ja", "ko", "es", "fr", "de", "ru", "pt"];
const defaultLocale = "en";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname has a supported locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Redirect if there is no locale prefix
  // In the future, we could inspect the Accept-Language header, but standard fallback is defaultLocale
  const locale = defaultLocale;

  return NextResponse.redirect(
    new URL(`/${locale}${pathname}`, request.url)
  );
}

export const config = {
  matcher: [
    // Skip internal paths (_next, api, static files, images, icons, etc.)
    "/((?!_next/static|_next/image|api|icon.png|favicon.png|robots.txt|sitemap.xml|.*\\..*).*)"
  ],
};
