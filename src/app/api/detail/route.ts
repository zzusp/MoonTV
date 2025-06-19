import { NextResponse } from 'next/server';

import { getCacheTime } from '@/lib/config';
import { getVideoDetail } from '@/lib/video';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const sourceCode = searchParams.get('source');

  if (!id || !sourceCode) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  try {
    const result = await getVideoDetail(id, sourceCode);
    const cacheTime = getCacheTime();

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': `public, max-age=${cacheTime}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
