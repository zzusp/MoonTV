/* eslint-disable no-console */

import { NextResponse } from 'next/server';

import { AdminConfigResult } from '@/lib/admin.types';
import { getConfig } from '@/lib/config';

export const runtime = 'edge';

export async function GET() {
  try {
    const config = getConfig();
    const result: AdminConfigResult = {
      Role: 'owner',
      Config: config,
    };

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store', // 管理员配置不缓存
      },
    });
  } catch (error) {
    console.error('获取管理员配置失败:', error);
    return NextResponse.json(
      {
        error: '获取管理员配置失败',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const updateData = await request.json();

    // 在实际应用中，这里应该验证用户权限并更新配置
    console.log('更新管理员配置:', updateData);

    // 模拟配置更新
    // 在实际应用中，这里应该将配置保存到数据库或配置文件

    return NextResponse.json({
      success: true,
      message: '配置更新成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('更新管理员配置失败:', error);
    return NextResponse.json(
      {
        error: '更新管理员配置失败',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
