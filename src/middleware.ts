import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Get hostname of request (e.g. demo.vercel.pub, demo.localhost:3000)
  const hostname = req.headers.get('host') || 'localhost:3000';

  const searchParams = req.nextUrl.searchParams.toString();
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`;

  // If the hostname is NOT the standard platform domains (e.g. artsfest-system.vercel.app, localhost:3000)
  // Let's assume standard domains are localhost and vercel app domains.
  // We rewrite all requests that are NOT localhost and NOT *.vercel.app to the /_domain/[domain] folder.
  // Wait, local testing might use a custom domain mapped via /etc/hosts or localhost port.
  
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  const isVercel = hostname.endsWith('.vercel.app');
  const isNetlify = hostname.endsWith('.netlify.app');

  // If it's a custom domain
  if (!isLocalhost && !isVercel && !isNetlify) {
    // Exclude core app routes from custom domain rewriting so they can still be accessed
    const coreRoutes = ['/login', '/dashboard', '/super-admin', '/print', '/hub', '/test'];
    const isCoreRoute = coreRoutes.some(route => url.pathname.startsWith(route));

    if (!isCoreRoute) {
      // Normalize by stripping www. to match database records easily
      const normalizedHostname = hostname.replace(/^www\./, '');
      // Rewrite to our dynamic route
      return NextResponse.rewrite(new URL(`/domain/${normalizedHostname}${path}`, req.url));
    }
  }

  // Otherwise, let the normal Next.js router handle it
  return NextResponse.next();
}
