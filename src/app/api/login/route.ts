import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const result = process.env.PASSWORD;

    if (!result) {
      return NextResponse.json({ ok: true });
    }

    const { password } = await req.json();
    if (typeof password !== 'string') {
      return NextResponse.json({ error: '密码不能为空' }, { status: 400 });
    }

    const matched = password === result;

    if (!matched) {
      return NextResponse.json(
        { ok: false, error: '密码错误' },
        { status: 401 }
      );
    }

    // 登录成功：写入 HttpOnly Cookie
    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: 'password',
      value: password,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 天
      path: '/',
    });

    return res;
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 使用 Cookie 校验登录状态
export async function GET(req: NextRequest) {
  try {
    const result = process.env.PASSWORD;

    // 未设置 PASSWORD 则直接放行
    if (!result) {
      return NextResponse.json({ ok: true });
    }

    const cookiePassword = req.cookies.get('password')?.value;
    const matched = cookiePassword === result;

    if (!matched) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
