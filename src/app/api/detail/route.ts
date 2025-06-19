import { NextResponse } from 'next/server';

import { API_CONFIG, ApiSite, getApiSites, getCacheTime } from '@/lib/config';

const M3U8_PATTERN = /(https?:\/\/[^"'\s]+?\.m3u8)/g;

// 清理 HTML 标签的工具函数
function cleanHtmlTags(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '\n') // 将 HTML 标签替换为换行
    .replace(/\n+/g, '\n') // 将多个连续换行合并为一个
    .replace(/[ \t]+/g, ' ') // 将多个连续空格和制表符合并为一个空格，但保留换行符
    .replace(/^\n+|\n+$/g, '') // 去掉首尾换行
    .trim(); // 去掉首尾空格
}

export interface VideoDetail {
  code: number;
  episodes: string[];
  detailUrl: string;
  videoInfo: {
    title: string;
    cover?: string;
    desc?: string;
    type?: string;
    year?: string;
    area?: string;
    director?: string;
    actor?: string;
    remarks?: string;
    source_name: string;
    source: string;
    id: string;
  };
}

async function handleSpecialSourceDetail(
  id: string,
  apiSite: ApiSite
): Promise<VideoDetail> {
  const detailUrl = `${apiSite.detail}/index.php/vod/detail/id/${id}.html`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const response = await fetch(detailUrl, {
    headers: API_CONFIG.detail.headers,
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`详情页请求失败: ${response.status}`);
  }

  const html = await response.text();
  let matches: string[] = [];

  if (apiSite.key === 'ffzy') {
    const ffzyPattern =
      /\$(https?:\/\/[^"'\s]+?\/\d{8}\/\d+_[a-f0-9]+\/index\.m3u8)/g;
    matches = html.match(ffzyPattern) || [];
  }

  if (matches.length === 0) {
    const generalPattern = /\$(https?:\/\/[^"'\s]+?\.m3u8)/g;
    matches = html.match(generalPattern) || [];
  }

  matches = Array.from(new Set(matches));
  matches = matches.map((link: string) => {
    link = link.substring(1, link.length);
    const parenIndex = link.indexOf('(');
    return parenIndex > 0 ? link.substring(0, parenIndex) : link;
  });

  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const titleText = titleMatch ? titleMatch[1].trim() : '';

  const descMatch = html.match(
    /<div[^>]*class=["']sketch["'][^>]*>([\s\S]*?)<\/div>/
  );
  const descText = descMatch ? cleanHtmlTags(descMatch[1]) : '';

  const coverMatch = html.match(/(https?:\/\/[^"'\s]+?\.jpg)/g);
  const coverUrl = coverMatch ? coverMatch[0].trim() : '';

  return {
    code: 200,
    episodes: matches,
    detailUrl: detailUrl,
    videoInfo: {
      title: titleText,
      cover: coverUrl,
      desc: descText,
      source_name: apiSite.name,
      source: apiSite.key,
      id: id,
    },
  };
}

async function getDetailFromApi(
  apiSite: ApiSite,
  id: string
): Promise<VideoDetail> {
  const detailUrl = `${apiSite.api}${API_CONFIG.detail.path}${id}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const response = await fetch(detailUrl, {
    headers: API_CONFIG.detail.headers,
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`详情请求失败: ${response.status}`);
  }

  const data = await response.json();

  if (
    !data ||
    !data.list ||
    !Array.isArray(data.list) ||
    data.list.length === 0
  ) {
    throw new Error('获取到的详情内容无效');
  }

  const videoDetail = data.list[0];
  let episodes: string[] = [];

  if (videoDetail.vod_play_url) {
    const playSources = videoDetail.vod_play_url.split('$$$');

    if (playSources.length > 0) {
      const mainSource = playSources[0];
      const episodeList = mainSource.split('#');

      episodes = episodeList
        .map((ep: string) => {
          const parts = ep.split('$');
          return parts.length > 1 ? parts[1] : '';
        })
        .filter(
          (url: string) =>
            url && (url.startsWith('http://') || url.startsWith('https://'))
        );
    }
  }

  if (episodes.length === 0 && videoDetail.vod_content) {
    const matches = videoDetail.vod_content.match(M3U8_PATTERN) || [];
    episodes = matches.map((link: string) => link.replace(/^\$/, ''));
  }

  return {
    code: 200,
    episodes: episodes,
    detailUrl: detailUrl,
    videoInfo: {
      title: videoDetail.vod_name,
      cover: videoDetail.vod_pic,
      desc: cleanHtmlTags(videoDetail.vod_content),
      type: videoDetail.type_name,
      year: videoDetail.vod_year,
      area: videoDetail.vod_area,
      director: videoDetail.vod_director,
      actor: videoDetail.vod_actor,
      remarks: videoDetail.vod_remarks,
      source_name: apiSite.name,
      source: apiSite.key,
      id: id,
    },
  };
}

export async function getVideoDetail(
  id: string,
  sourceCode: string
): Promise<VideoDetail> {
  if (!id) {
    throw new Error('缺少视频ID参数');
  }

  if (!/^[\w-]+$/.test(id)) {
    throw new Error('无效的视频ID格式');
  }

  const apiSites = getApiSites();
  const apiSite = apiSites.find((site) => site.key === sourceCode);

  if (!apiSite) {
    throw new Error('无效的API来源');
  }

  if (apiSite.detail) {
    return await handleSpecialSourceDetail(id, apiSite);
  } else {
    return await getDetailFromApi(apiSite, id);
  }
}

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
