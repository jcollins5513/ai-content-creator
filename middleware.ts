import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  

  // For now, we'll handle authentication checks on the client side
  // since Firebase Auth state is not available in middleware
  // This middleware mainly handles route structure and redirects
  
  // If accessing root and not authenticated, redirect to auth page
  if (pathname === '/') {
    // We'll let the client-side handle this redirect based on auth state
    return NextResponse.next();
  }

  // Allow all other requests to proceed
  // Client-side ProtectedRoute components will handle authentication checks
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};