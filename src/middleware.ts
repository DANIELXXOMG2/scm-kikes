import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('firebaseAuthToken'); // Usaremos un token en cookie
  const { pathname } = request.nextUrl;

  // Si no hay token y el usuario intenta acceder a una ruta protegida
  if (!token && pathname.startsWith('/app')) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Si hay token y el usuario intenta acceder al login
  if (token && (pathname === '/login' || pathname === '/recuperar-password')) {
    const appUrl = new URL('/app', request.url);
    return NextResponse.redirect(appUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/login', '/recuperar-password'],
};
