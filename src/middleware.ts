import { NextRequest, NextResponse } from 'next/server';

// 全站（含 /api）鉴权中间件，运行于 Edge Runtime。
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1. 放行无需鉴权的路径
  if (
    pathname.startsWith('/login') || // 登录页
    pathname.startsWith('/api/login') || // 登录接口
    pathname.startsWith('/_next') || // Next.js 静态文件
    pathname === '/favicon.ico' ||
    pathname.startsWith('/icons') ||
    pathname === '/manifest.json' ||
    pathname === '/logo.png' ||
    pathname === '/screenshot.png'
  ) {
    return NextResponse.next();
  }

  // 通过后端接口验证登录状态（GET /api/login）
  const origin = req.nextUrl.origin;
  const verifyRes = await fetch(`${origin}/api/login`, {
    method: 'GET',
    headers: {
      Cookie: req.headers.get('cookie') || '',
    },
  });

  if (verifyRes.ok) {
    return NextResponse.next();
  }

  // 未通过校验：API 返回 401，页面跳转登录
  if (pathname.startsWith('/api')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('redirect', pathname + search);
  return NextResponse.redirect(loginUrl);
}

// 2. 指定哪些路径使用 middleware
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|logo.png|screenshot.png).*)',
  ],
};
