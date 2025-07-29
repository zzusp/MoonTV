// EdgeOne Pages Function for /api/detail
// 从 src/app/api/detail/route.ts 完整迁移而来

import {
  API_CONFIG,
  cleanHtmlTags,
  getApiSites,
  getCacheTime,
} from '../_shared/config.js';

// 匹配 m3u8 链接的正则
const M3U8_PATTERN = /(https?:\/\/[^"'\s]+?\.m3u8)/g;

async function handleSpecialSourceDetail(id, apiSite) {
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
  let matches = [];

  if (apiSite.key === 'ffzy') {
    const ffzyPattern =
      /\$(https?:\/\/[^"'\s]+?\/\d{8}\/\d+_[a-f0-9]+\/index\.m3u8)/g;
    matches = html.match(ffzyPattern) || [];
  }

  if (matches.length === 0) {
    const generalPattern = /\$(https?:\/\/[^"'\s]+?\.m3u8)/g;
    matches = html.match(generalPattern) || [];
  }

  // 去重并清理链接前缀
  matches = Array.from(new Set(matches)).map((link) => {
    link = link.substring(1); // 去掉开头的 $
    const parenIndex = link.indexOf('(');
    return parenIndex > 0 ? link.substring(0, parenIndex) : link;
  });

  // 提取标题
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const titleText = titleMatch ? titleMatch[1].trim() : '';

  // 提取描述
  const descMatch = html.match(
    /<div[^>]*class=["']sketch["'][^>]*>([\s\S]*?)<\/div>/
  );
  const descText = descMatch ? cleanHtmlTags(descMatch[1]) : '';

  // 提取封面
  const coverMatch = html.match(/(https?:\/\/[^"'\s]+?\.jpg)/g);
  const coverUrl = coverMatch ? coverMatch[0].trim() : '';

  return {
    code: 200,
    episodes: matches,
    detailUrl,
    videoInfo: {
      title: titleText,
      cover: coverUrl,
      desc: descText,
      source_name: apiSite.name,
      source: apiSite.key,
      id,
    },
  };
}

async function getDetailFromApi(apiSite, id) {
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
  let episodes = [];

  // 处理播放源拆分
  if (videoDetail.vod_play_url) {
    const playSources = videoDetail.vod_play_url.split('$$$');
    if (playSources.length > 0) {
      const mainSource = playSources[0];
      const episodeList = mainSource.split('#');
      episodes = episodeList
        .map((ep) => {
          const parts = ep.split('$');
          return parts.length > 1 ? parts[1] : '';
        })
        .filter(
          (url) =>
            url && (url.startsWith('http://') || url.startsWith('https://'))
        );
    }
  }

  // 如果播放源为空，则尝试从内容中解析 m3u8
  if (episodes.length === 0 && videoDetail.vod_content) {
    const matches = videoDetail.vod_content.match(M3U8_PATTERN) || [];
    episodes = matches.map((link) => link.replace(/^\$/, ''));
  }

  return {
    code: 200,
    episodes,
    detailUrl,
    videoInfo: {
      title: videoDetail.vod_name,
      cover: videoDetail.vod_pic,
      desc: cleanHtmlTags(videoDetail.vod_content),
      type: videoDetail.type_name,
      year: videoDetail.vod_year
        ? videoDetail.vod_year.match(/\d{4}/)?.[0] || ''
        : '',
      area: videoDetail.vod_area,
      director: videoDetail.vod_director,
      actor: videoDetail.vod_actor,
      remarks: videoDetail.vod_remarks,
      source_name: apiSite.name,
      source: apiSite.key,
      id,
    },
  };
}

// 获取视频详情的主要方法
async function getVideoDetail(id, sourceCode) {
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
    return handleSpecialSourceDetail(id, apiSite);
  }

  return getDetailFromApi(apiSite, id);
}

export async function onRequest(context) {
  const { request } = context;

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const sourceCode = url.searchParams.get('source');

  if (!id || !sourceCode) {
    return new Response(JSON.stringify({ error: '缺少必要参数' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await getVideoDetail(id, sourceCode);
    const cacheTime = getCacheTime();

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${cacheTime}`,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
