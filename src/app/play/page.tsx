/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, no-console, @next/next/no-img-element */

'use client';

import { Heart } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useEffect, useRef, useState } from 'react';
import React from 'react';

import {
  deletePlayRecord,
  generateStorageKey,
  getAllPlayRecords,
  isFavorited,
  savePlayRecord,
  toggleFavorite,
} from '@/lib/db.client';
import { VideoDetail } from '@/lib/video';

// 扩展 HTMLVideoElement 类型以支持 hls 属性
declare global {
  interface HTMLVideoElement {
    hls?: any;
  }
}

// 搜索结果类型
interface SearchResult {
  id: string;
  title: string;
  poster: string;
  episodes?: number;
  source: string;
  source_name: string;
}

function PlayPageClient() {
  const searchParams = useSearchParams();
  const artRef = useRef<HTMLDivElement>(null);
  const artPlayerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 使用 useState 保存视频详情
  const [detail, setDetail] = useState<VideoDetail | null>(null);

  // 初始标题：如果 URL 中携带 title 参数，则优先使用
  const [videoTitle, setVideoTitle] = useState(searchParams.get('title') || '');
  const [videoCover, setVideoCover] = useState('');

  const [currentSource, setCurrentSource] = useState(
    searchParams.get('source') || ''
  );
  const [currentId, setCurrentId] = useState(searchParams.get('id') || '');
  const [sourceChanging, setSourceChanging] = useState(false);
  const initialIndex = parseInt(searchParams.get('index') || '1') - 1; // 转换为0基数组索引

  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(initialIndex);
  const [showEpisodePanel, setShowEpisodePanel] = useState(false);
  const [showSourcePanel, setShowSourcePanel] = useState(false);
  const [showTopBar, setShowTopBar] = useState(true);
  const topBarTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showShortcutHint, setShowShortcutHint] = useState(false);
  const [shortcutText, setShortcutText] = useState('');
  const [shortcutDirection, setShortcutDirection] = useState('');
  const shortcutHintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 换源相关状态
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const hasSearchedRef = useRef(false);

  // 视频播放地址
  const [videoUrl, setVideoUrl] = useState('');

  // 播放进度保存相关
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const videoEventListenersRef = useRef<{
    video: HTMLVideoElement;
    listeners: Array<{ event: string; handler: EventListener }>;
  } | null>(null);

  // 总集数：从 detail 中获取，保证随 detail 更新而变化
  const totalEpisodes = detail?.episodes?.length || 0;

  // 收藏状态
  const [favorited, setFavorited] = useState(false);

  // 用于记录是否需要在播放器 ready 后跳转到指定进度
  const resumeTimeRef = useRef<number | null>(null);

  // 动态导入的 Artplayer 与 Hls 实例
  const [{ Artplayer, Hls }, setPlayers] = useState<{
    Artplayer: any | null;
    Hls: any | null;
  }>({ Artplayer: null, Hls: null });

  // 解决 iOS Safari 100vh 不准确的问题：将视口高度写入 CSS 变量 --vh
  useEffect(() => {
    const setVH = () => {
      if (typeof window !== 'undefined') {
        document.documentElement.style.setProperty(
          '--vh',
          `${window.innerHeight * 0.01}px`
        );
      }
    };
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  // 根据 detail 和集数索引更新视频地址（仅当地址真正变化时）
  const updateVideoUrl = (
    detailData: VideoDetail | null,
    episodeIndex: number
  ) => {
    const newUrl = detailData?.episodes[episodeIndex] || '';
    if (newUrl != videoUrl) {
      setVideoUrl(newUrl);
    }
  };

  // 在指定 video 元素内确保存在 <source src="...">，供部分浏览器兼容
  const ensureVideoSource = (video: HTMLVideoElement | null, url: string) => {
    if (!video || !url) return;
    const sources = Array.from(video.getElementsByTagName('source'));
    const existed = sources.some((s) => s.src === url);
    if (!existed) {
      // 移除旧的 source，保持唯一
      sources.forEach((s) => s.remove());
      const sourceEl = document.createElement('source');
      sourceEl.src = url;
      sourceEl.type = 'video/mp4'; // 默认类型，HLS 会被 Artplayer/Hls 处理
      video.appendChild(sourceEl);
    }

    // 始终允许远程播放（AirPlay / Cast）
    video.disableRemotePlayback = false;
    // 如果曾经有禁用属性，移除之
    if (video.hasAttribute('disableRemotePlayback')) {
      video.removeAttribute('disableRemotePlayback');
    }
  };

  // 当集数索引变化时自动更新视频地址
  useEffect(() => {
    updateVideoUrl(detail, currentEpisodeIndex);
  }, [detail, currentEpisodeIndex]);

  // 确保初始状态与URL参数同步
  useEffect(() => {
    const urlSource = searchParams.get('source');
    const urlId = searchParams.get('id');

    if (urlSource && urlSource !== currentSource) {
      setCurrentSource(urlSource);
    }
    if (urlId && urlId !== currentId) {
      setCurrentId(urlId);
    }
  }, [searchParams, currentSource, currentId]);

  // 动态加载 Artplayer 与 Hls 并保存到 state
  useEffect(() => {
    (async () => {
      try {
        const [ArtplayerModule, HlsModule] = await Promise.all([
          import('artplayer'),
          import('hls.js'),
        ]);
        setPlayers({
          Artplayer: ArtplayerModule.default,
          Hls: HlsModule.default,
        });
      } catch (err) {
        console.error('Failed to load players:', err);
        setError('播放器加载失败');
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!currentSource || !currentId) {
      setError('缺少必要参数');
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      try {
        const response = await fetch(
          `/api/detail?source=${currentSource}&id=${currentId}`
        );
        if (!response.ok) {
          throw new Error('获取视频详情失败');
        }
        const data = await response.json();

        // 更新状态保存详情
        setVideoTitle(data.videoInfo.title || videoTitle);
        setVideoCover(data.videoInfo.cover);
        setDetail(data);

        // 确保集数索引在有效范围内
        if (currentEpisodeIndex >= data.episodes.length) {
          setCurrentEpisodeIndex(0);
        }

        // 清理URL参数（移除index参数）
        if (searchParams.has('index')) {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('index');
          newUrl.searchParams.delete('position');
          window.history.replaceState({}, '', newUrl.toString());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取视频详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [currentSource]);

  /* -------------------- 播放记录处理 -------------------- */
  useEffect(() => {
    // 仅在初次挂载时检查播放记录
    const initFromHistory = async () => {
      if (!currentSource || !currentId) return;

      try {
        const allRecords = await getAllPlayRecords();
        const key = generateStorageKey(currentSource, currentId);
        const record = allRecords[key];

        // URL 参数
        const urlIndexParam = searchParams.get('index');
        const urlPositionParam = searchParams.get('position');

        // 当index参数存在时的处理逻辑
        if (urlIndexParam) {
          const urlIndex = parseInt(urlIndexParam, 10) - 1;
          let targetTime = 0; // 默认从0开始

          // 只有index参数和position参数都存在时才生效position
          if (urlPositionParam) {
            targetTime = parseInt(urlPositionParam, 10);
          } else if (record && urlIndex === record.index - 1) {
            // 如果有同集播放记录则跳转到播放记录处
            targetTime = record.play_time;
          }
          // 否则从0开始（targetTime已经是0）

          // 更新当前选集索引
          if (urlIndex !== currentEpisodeIndex) {
            setCurrentEpisodeIndex(urlIndex);
          }

          // 保存待恢复的播放进度，待播放器就绪后跳转
          resumeTimeRef.current = targetTime;
        } else if (record) {
          // 没有index参数但有播放记录时，使用原有逻辑
          const targetIndex = record.index - 1;
          const targetTime = record.play_time;

          // 更新当前选集索引
          if (targetIndex !== currentEpisodeIndex) {
            setCurrentEpisodeIndex(targetIndex);
          }

          // 保存待恢复的播放进度，待播放器就绪后跳转
          resumeTimeRef.current = targetTime;
        }
      } catch (err) {
        console.error('读取播放记录失败:', err);
      }
    };

    initFromHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const attachVideoEventListeners = (video: HTMLVideoElement) => {
    if (!video) return;

    // 移除旧监听器（如果存在）
    if (videoEventListenersRef.current) {
      const { video: oldVideo, listeners } = videoEventListenersRef.current;
      listeners.forEach(({ event, handler }) => {
        oldVideo.removeEventListener(event, handler);
      });
      videoEventListenersRef.current = null;
    }

    // 暂停时立即保存
    const pauseHandler = () => {
      saveCurrentPlayProgress();
    };

    // timeupdate 节流（5 秒）保存
    let lastSave = 0;
    const timeUpdateHandler = () => {
      const now = Date.now();
      if (now - lastSave > 5000) {
        saveCurrentPlayProgress();
        lastSave = now;
      }
    };

    video.addEventListener('pause', pauseHandler);
    video.addEventListener('timeupdate', timeUpdateHandler);

    videoEventListenersRef.current = {
      video,
      listeners: [
        { event: 'pause', handler: pauseHandler },
        { event: 'timeupdate', handler: timeUpdateHandler },
      ],
    };
  };

  // 播放器创建/切换逻辑，只依赖视频URL和集数索引
  useEffect(() => {
    if (
      !Artplayer ||
      !Hls ||
      !videoUrl ||
      loading ||
      currentEpisodeIndex === null ||
      !artRef.current
    )
      return;

    // 确保选集索引有效
    if (
      !detail ||
      !detail.episodes ||
      currentEpisodeIndex >= detail.episodes.length ||
      currentEpisodeIndex < 0
    ) {
      setError(`选集索引无效，当前共 ${totalEpisodes} 集`);
      return;
    }

    if (!videoUrl) {
      setError('视频地址无效');
      return;
    }
    console.log(videoUrl);

    // 检测是否为WebKit浏览器
    const isWebkit =
      typeof window !== 'undefined' &&
      typeof (window as any).webkitConvertPointFromNodeToPage === 'function';

    // 非WebKit浏览器且播放器已存在，使用switch方法切换
    if (!isWebkit && artPlayerRef.current) {
      artPlayerRef.current.switch = videoUrl;
      artPlayerRef.current.title = `${videoTitle} - 第${
        currentEpisodeIndex + 1
      }集`;
      artPlayerRef.current.poster = videoCover;
      if (artPlayerRef.current?.video) {
        attachVideoEventListeners(
          artPlayerRef.current.video as HTMLVideoElement
        );
        ensureVideoSource(
          artPlayerRef.current.video as HTMLVideoElement,
          videoUrl
        );
      }
      return;
    }

    // WebKit浏览器或首次创建：销毁之前的播放器实例并创建新的
    if (artPlayerRef.current) {
      if (artPlayerRef.current.video && artPlayerRef.current.video.hls) {
        artPlayerRef.current.video.hls.destroy();
      }
      // 销毁播放器实例
      artPlayerRef.current.destroy();
      artPlayerRef.current = null;
    }

    try {
      // 创建新的播放器实例
      artPlayerRef.current = new Artplayer({
        container: artRef.current,
        url: videoUrl,
        title: `${videoTitle} - 第${currentEpisodeIndex + 1}集`,
        poster: videoCover,
        volume: 0.7,
        isLive: false,
        muted: false,
        autoplay: true,
        pip: false,
        autoSize: false,
        autoMini: false,
        screenshot: false,
        setting: true,
        loop: false,
        flip: false,
        playbackRate: true,
        aspectRatio: false,
        fullscreen: true,
        fullscreenWeb: false,
        subtitleOffset: false,
        miniProgressBar: false,
        mutex: true,
        backdrop: true,
        playsInline: true,
        autoPlayback: false,
        airplay: true,
        theme: '#23ade5',
        lang: 'zh-cn',
        hotkey: false,
        moreVideoAttr: {
          crossOrigin: 'anonymous',
        },
        // HLS 支持配置
        customType: {
          m3u8: function (video: HTMLVideoElement, url: string) {
            if (!Hls) {
              console.error('HLS.js 未加载');
              return;
            }

            if (Hls.isSupported()) {
              if (video.hls) {
                video.hls.destroy();
              }
              const hls = new Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90,
              });

              hls.loadSource(url);
              hls.attachMedia(video);
              video.hls = hls;

              hls.on(Hls.Events.ERROR, function (event: any, data: any) {
                console.error('HLS Error:', event, data);
                if (data.fatal) {
                  switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                      console.log('网络错误，尝试恢复...');
                      hls.startLoad();
                      break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                      console.log('媒体错误，尝试恢复...');
                      hls.recoverMediaError();
                      break;
                    default:
                      console.log('无法恢复的错误');
                      hls.destroy();
                      break;
                  }
                }
              });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              // Safari 原生支持 HLS
              video.src = url;
            } else {
              console.error('此浏览器不支持 HLS');
            }
          },
        },
        icons: {
          loading:
            '<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDUwIDUwIj48cGF0aCBkPSJNMjUuMjUxIDYuNDYxYy0xMC4zMTggMC0xOC42ODMgOC4zNjUtMTguNjgzIDE4LjY4M2g0LjA2OGMwLTguMDcgNi41NDUtMTQuNjE1IDE0LjYxNS0xNC42MTVWNi40NjF6IiBmaWxsPSIjMDA5Njg4Ij48YW5pbWF0ZVRyYW5zZm9ybSBhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iIGF0dHJpYnV0ZVR5cGU9IlhNTCIgZHVyPSIxcyIgZnJvbT0iMCAyNSAyNSIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIHRvPSIzNjAgMjUgMjUiIHR5cGU9InJvdGF0ZSIvPjwvcGF0aD48L3N2Zz4=">',
        },
        // 控制栏配置
        controls: [
          {
            position: 'left',
            index: 10,
            html: '<i class="art-icon flex"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" fill="currentColor"/></svg></i>',
            tooltip: '后退10秒',
            click: function () {
              if (artPlayerRef.current) {
                artPlayerRef.current.backward = 10;
              }
            },
          },
          {
            position: 'left',
            index: 12,
            html: '<i class="art-icon flex"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 13c0 4.4 3.6 8 8 8s8-3.6 8-8h-2c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6v4l5-5-5-5v4c-4.4 0-8 3.6-8 8z" fill="currentColor"/></svg></i>',
            tooltip: '前进10秒',
            click: function () {
              if (artPlayerRef.current) {
                artPlayerRef.current.forward = 10;
              }
            },
          },
          {
            position: 'left',
            index: 13,
            html: '<i class="art-icon flex"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" fill="currentColor"/></svg></i>',
            tooltip: '播放下一集',
            click: function () {
              handleNextEpisode();
            },
          },
          {
            position: 'right',
            html: '选集',
            tooltip: '选择集数',
            click: function () {
              setShowEpisodePanel(true);
            },
          },
          {
            position: 'right',
            html: '换源',
            tooltip: '更换视频源',
            click: function () {
              handleSourcePanelOpen();
            },
          },
        ],
      });

      // 监听播放器事件
      artPlayerRef.current.on('ready', () => {
        console.log('播放器准备就绪');
        setError(null);

        // 若存在需要恢复的播放进度，则跳转
        if (resumeTimeRef.current && resumeTimeRef.current > 0) {
          try {
            artPlayerRef.current.video.currentTime = resumeTimeRef.current;
          } catch (err) {
            console.warn('恢复播放进度失败:', err);
          }
          resumeTimeRef.current = null;
        }
      });

      artPlayerRef.current.on('error', (err: any) => {
        console.error('播放器错误:', err);
        setError('视频播放失败');
      });

      // 监听视频播放结束事件，自动播放下一集
      artPlayerRef.current.on('video:ended', () => {
        if (
          detail &&
          detail.episodes &&
          currentEpisodeIndex < detail.episodes.length - 1
        ) {
          setTimeout(() => {
            setCurrentEpisodeIndex(currentEpisodeIndex + 1);
          }, 1000);
        }
      });
      if (artPlayerRef.current?.video) {
        attachVideoEventListeners(
          artPlayerRef.current.video as HTMLVideoElement
        );
        ensureVideoSource(
          artPlayerRef.current.video as HTMLVideoElement,
          videoUrl
        );
      }
    } catch (err) {
      console.error('创建播放器失败:', err);
      setError('播放器初始化失败');
    }
  }, [Artplayer, Hls, videoUrl]);

  // 页面卸载和隐藏时保存播放进度
  useEffect(() => {
    // 页面即将卸载时保存播放进度
    const handleBeforeUnload = () => {
      saveCurrentPlayProgress();
    };

    // 页面可见性变化时保存播放进度
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveCurrentPlayProgress();
      }
    };

    // 添加事件监听器
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // 清理事件监听器
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentEpisodeIndex, detail, artPlayerRef.current]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (topBarTimeoutRef.current) {
        clearTimeout(topBarTimeoutRef.current);
      }
      if (shortcutHintTimeoutRef.current) {
        clearTimeout(shortcutHintTimeoutRef.current);
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }

      // 清理视频事件监听器
      if (videoEventListenersRef.current) {
        const { video, listeners } = videoEventListenersRef.current;
        listeners.forEach(({ event, handler }) => {
          video.removeEventListener(event, handler);
        });
        videoEventListenersRef.current = null;
      }
    };
  }, []);

  // 当视频标题变化时重置搜索状态
  useEffect(() => {
    if (videoTitle) {
      hasSearchedRef.current = false;
      setSearchResults([]);
      setSearchError(null);
    }
  }, [videoTitle]);

  // 添加键盘事件监听器
  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, [currentEpisodeIndex, detail, artPlayerRef.current]);

  // 处理选集切换
  const handleEpisodeChange = (episodeIndex: number) => {
    if (episodeIndex >= 0 && episodeIndex < totalEpisodes) {
      // 在更换集数前保存当前播放进度
      if (
        artPlayerRef.current &&
        artPlayerRef.current.video &&
        !artPlayerRef.current.video.paused
      ) {
        saveCurrentPlayProgress();
      }
      setCurrentEpisodeIndex(episodeIndex);
      setShowEpisodePanel(false);
    }
  };

  // 处理下一集
  const handleNextEpisode = () => {
    if (
      detail &&
      detail.episodes &&
      currentEpisodeIndex < detail.episodes.length - 1
    ) {
      // 在更换集数前保存当前播放进度
      if (
        artPlayerRef.current &&
        artPlayerRef.current.video &&
        !artPlayerRef.current.video.paused
      ) {
        saveCurrentPlayProgress();
      }
      setCurrentEpisodeIndex(currentEpisodeIndex + 1);
    }
  };

  // 处理鼠标移动，显示顶栏并重置隐藏定时器
  const handleMouseMove = () => {
    setShowTopBar(true);
    if (topBarTimeoutRef.current) {
      clearTimeout(topBarTimeoutRef.current);
    }
    // 仅当视频正在播放时，才在 3 秒后隐藏顶栏
    if (
      artPlayerRef.current &&
      artPlayerRef.current.video &&
      !artPlayerRef.current.video.paused
    ) {
      topBarTimeoutRef.current = setTimeout(() => {
        setShowTopBar(false);
      }, 3000);
    }
  };

  // 处理点击事件，显示顶栏并重置隐藏定时器
  const handleClick = () => {
    setShowTopBar(true);
    if (topBarTimeoutRef.current) {
      clearTimeout(topBarTimeoutRef.current);
    }
    // 仅当视频正在播放时，才在 3 秒后隐藏顶栏
    if (
      artPlayerRef.current &&
      artPlayerRef.current.video &&
      !artPlayerRef.current.video.paused
    ) {
      topBarTimeoutRef.current = setTimeout(() => {
        setShowTopBar(false);
      }, 3000);
    }
  };

  // 处理返回按钮点击
  const handleBack = () => {
    window.location.href = `/detail?source=${currentSource}&id=${currentId}`;
  };

  // 处理上一集
  const handlePreviousEpisode = () => {
    if (detail && currentEpisodeIndex > 0) {
      if (
        artPlayerRef.current &&
        artPlayerRef.current.video &&
        !artPlayerRef.current.video.paused
      ) {
        saveCurrentPlayProgress();
      }
      setCurrentEpisodeIndex(currentEpisodeIndex - 1);
    }
  };

  // 搜索视频源
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error('搜索失败');
      }
      const data = await response.json();

      // 处理搜索结果：每个数据源只展示一个，优先展示与title同名的结果
      const processedResults: SearchResult[] = [];
      const sourceMap = new Map<string, SearchResult[]>();

      // 按数据源分组
      data.results?.forEach((result: SearchResult) => {
        if (!sourceMap.has(result.source)) {
          sourceMap.set(result.source, []);
        }
        const list = sourceMap.get(result.source);
        if (list) {
          list.push(result);
        }
      });

      // 为每个数据源选择最佳结果
      sourceMap.forEach((results) => {
        if (results.length === 0) return;

        // 优先选择与当前视频标题完全匹配的结果
        const exactMatch = results.find(
          (result) => result.title.toLowerCase() === videoTitle.toLowerCase()
        );

        // 如果没有完全匹配，选择第一个结果
        const selectedResult = exactMatch || results[0];
        processedResults.push(selectedResult);
      });

      setSearchResults(processedResults);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : '搜索失败');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // 处理换源
  const handleSourceChange = async (
    newSource: string,
    newId: string,
    newTitle: string
  ) => {
    try {
      // 显示换源加载状态
      setSourceChanging(true);
      setError(null);

      // 清除前一个历史记录
      if (currentSource && currentId) {
        try {
          await deletePlayRecord(currentSource, currentId);
          console.log('已清除前一个播放记录');
        } catch (err) {
          console.error('清除播放记录失败:', err);
        }
      }

      // 获取新源的详情
      const response = await fetch(
        `/api/detail?source=${newSource}&id=${newId}`
      );
      if (!response.ok) {
        throw new Error('获取新源详情失败');
      }
      const newDetail = await response.json();

      // 尝试跳转到当前正在播放的集数
      let targetIndex = currentEpisodeIndex;

      // 如果当前集数超出新源的范围，则跳转到第一集
      if (!newDetail.episodes || targetIndex >= newDetail.episodes.length) {
        targetIndex = 0;
      }

      // 更新URL参数（不刷新页面）
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('source', newSource);
      newUrl.searchParams.set('id', newId);
      window.history.replaceState({}, '', newUrl.toString());

      // 关闭换源面板
      setShowSourcePanel(false);

      setVideoTitle(newDetail.videoInfo.title || newTitle);
      setVideoCover(newDetail.videoInfo.cover);
      setCurrentSource(newSource);
      setCurrentId(newId);
      setDetail(newDetail);
      setCurrentEpisodeIndex(targetIndex);
    } catch (err) {
      setError(err instanceof Error ? err.message : '换源失败');
    } finally {
      setSourceChanging(false);
    }
  };

  // 处理播放源面板展开
  const handleSourcePanelOpen = () => {
    setShowSourcePanel(true);
    // 只在第一次展开时搜索
    if (videoTitle && !hasSearchedRef.current) {
      handleSearch(videoTitle);
      hasSearchedRef.current = true;
    }
  };

  // 显示快捷键提示
  const displayShortcutHint = (text: string, direction: string) => {
    setShortcutText(text);
    setShortcutDirection(direction);
    setShowShortcutHint(true);

    // 清除之前的超时
    if (shortcutHintTimeoutRef.current) {
      clearTimeout(shortcutHintTimeoutRef.current);
    }

    // 2秒后隐藏
    shortcutHintTimeoutRef.current = setTimeout(() => {
      setShowShortcutHint(false);
    }, 2000);
  };

  // 处理全局快捷键
  const handleKeyboardShortcuts = (e: KeyboardEvent) => {
    // 忽略输入框中的按键事件
    if (
      (e.target as HTMLElement).tagName === 'INPUT' ||
      (e.target as HTMLElement).tagName === 'TEXTAREA'
    )
      return;

    // Alt + 左箭头 = 上一集
    if (e.altKey && e.key === 'ArrowLeft') {
      if (detail && currentEpisodeIndex > 0) {
        handlePreviousEpisode();
        displayShortcutHint('上一集', 'left');
        e.preventDefault();
      }
    }

    // Alt + 右箭头 = 下一集
    if (e.altKey && e.key === 'ArrowRight') {
      if (detail && currentEpisodeIndex < detail.episodes.length - 1) {
        handleNextEpisode();
        displayShortcutHint('下一集', 'right');
        e.preventDefault();
      }
    }

    // 左箭头 = 快退
    if (!e.altKey && e.key === 'ArrowLeft') {
      if (
        artPlayerRef.current &&
        artPlayerRef.current.video &&
        artPlayerRef.current.video.currentTime > 5
      ) {
        artPlayerRef.current.video.currentTime -= 10;
        displayShortcutHint('快退', 'left');
        e.preventDefault();
      }
    }

    // 右箭头 = 快进
    if (!e.altKey && e.key === 'ArrowRight') {
      if (
        artPlayerRef.current &&
        artPlayerRef.current.video &&
        artPlayerRef.current.video.currentTime <
          artPlayerRef.current.video.duration - 5
      ) {
        artPlayerRef.current.video.currentTime += 10;
        displayShortcutHint('快进', 'right');
        e.preventDefault();
      }
    }

    // 上箭头 = 音量+
    if (e.key === 'ArrowUp') {
      if (
        artPlayerRef.current &&
        artPlayerRef.current.video &&
        artPlayerRef.current.video.volume < 1
      ) {
        artPlayerRef.current.video.volume += 0.1;
        displayShortcutHint(
          `音量 ${Math.round(artPlayerRef.current.video.volume * 100)}`,
          'up'
        );
        e.preventDefault();
      }
    }

    // 下箭头 = 音量-
    if (e.key === 'ArrowDown') {
      if (
        artPlayerRef.current &&
        artPlayerRef.current.video &&
        artPlayerRef.current.video.volume > 0
      ) {
        artPlayerRef.current.video.volume -= 0.1;
        displayShortcutHint(
          `音量 ${Math.round(artPlayerRef.current.video.volume * 100)}`,
          'down'
        );
        e.preventDefault();
      }
    }

    // 空格 = 播放/暂停
    if (e.key === ' ') {
      if (artPlayerRef.current) {
        artPlayerRef.current.toggle();
        e.preventDefault();
      }
    }

    // f 键 = 切换全屏
    if (e.key === 'f' || e.key === 'F') {
      if (artPlayerRef.current) {
        artPlayerRef.current.fullscreen = !artPlayerRef.current.fullscreen;
        e.preventDefault();
      }
    }
  };

  // 保存播放进度的函数
  const saveCurrentPlayProgress = async () => {
    if (
      !artPlayerRef.current?.video ||
      !currentSource ||
      !currentId ||
      !videoTitle ||
      !detail?.videoInfo?.source_name
    ) {
      return;
    }

    const video = artPlayerRef.current.video;
    const currentTime = video.currentTime || 0;
    const duration = video.duration || 0;

    // 如果播放时间太短（少于5秒）或者视频时长无效，不保存
    if (currentTime < 1 || !duration) {
      return;
    }

    try {
      await savePlayRecord(currentSource, currentId, {
        title: videoTitle,
        source_name: detail.videoInfo.source_name,
        cover: videoCover,
        index: currentEpisodeIndex + 1, // 转换为1基索引
        total_episodes: totalEpisodes,
        play_time: Math.floor(currentTime),
        total_time: Math.floor(duration),
        save_time: Date.now(),
      });

      lastSaveTimeRef.current = Date.now();
      console.log('播放进度已保存:', {
        title: videoTitle,
        episode: currentEpisodeIndex + 1,
        progress: `${Math.floor(currentTime)}/${Math.floor(duration)}`,
      });
    } catch (err) {
      console.error('保存播放进度失败:', err);
    }
  };

  // 每当 source 或 id 变化时检查收藏状态
  useEffect(() => {
    if (!currentSource || !currentId) return;
    (async () => {
      try {
        const fav = await isFavorited(currentSource, currentId);
        setFavorited(fav);
      } catch (err) {
        console.error('检查收藏状态失败:', err);
      }
    })();
  }, [currentSource, currentId]);

  // 切换收藏
  const handleToggleFavorite = async () => {
    if (!currentSource || !currentId) return;

    try {
      const newState = await toggleFavorite(currentSource, currentId, {
        title: videoTitle,
        source_name: detail?.videoInfo.source_name || '',
        cover: videoCover || '',
        total_episodes: totalEpisodes || 1,
        save_time: Date.now(),
      });
      setFavorited(newState);
    } catch (err) {
      console.error('切换收藏失败:', err);
    }
  };

  if (loading) {
    return (
      <div className='min-h-[100dvh] bg-black flex items-center justify-center overflow-hidden overscroll-contain'>
        <div className='text-white text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <div className='text-lg'>加载中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-[100dvh] bg-black flex items-center justify-center overflow-hidden overscroll-contain'>
        <div className='text-white text-center'>
          <div className='text-xl font-semibold mb-4 text-red-400'>
            播放失败
          </div>
          <div className='text-base mb-6'>{error}</div>
          <button
            onClick={() => window.history.back()}
            className='px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors'
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className='min-h-[100dvh] bg-black flex items-center justify-center overflow-hidden overscroll-contain'>
        <div className='text-white text-center'>
          <div className='text-xl font-semibold mb-4'>未找到视频</div>
          <button
            onClick={() => window.history.back()}
            className='px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors'
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className='bg-black fixed inset-0 overflow-hidden overscroll-contain'
      style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      {/* 换源加载遮罩 */}
      {sourceChanging && (
        <div className='fixed inset-0 bg-black/50 z-[200] flex items-center justify-center'>
          <div className='text-white text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2'></div>
            <div className='text-sm'>换源中...</div>
          </div>
        </div>
      )}

      {/* 播放器容器 */}
      <div className='relative w-full h-full'>
        <div ref={artRef} className='w-full h-full'></div>

        {/* 顶栏 */}
        <div
          className={`absolute top-0 left-0 right-0 z-40 transition-opacity duration-300 ${
            showTopBar ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className='bg-black/60 backdrop-blur-sm px-6 py-4 relative flex items-center justify-center'>
            {/* 返回按钮 */}
            <button
              onClick={handleBack}
              className='absolute left-6 text-white hover:text-gray-300 transition-colors p-2'
            >
              <svg
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z'
                  fill='currentColor'
                />
              </svg>
            </button>

            {/* 中央标题及集数信息 */}
            <div className='text-center'>
              <div className='flex items-center justify-center gap-2 max-w-xs mx-auto'>
                <span className='text-white font-semibold text-lg truncate'>
                  {videoTitle}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite();
                  }}
                  className='flex-shrink-0'
                >
                  <Heart
                    className={`h-5 w-5 stroke-[2] ${
                      favorited ? 'text-red-500' : 'text-gray-300'
                    }`}
                    fill={favorited ? 'currentColor' : 'none'}
                  />
                </button>
              </div>

              {totalEpisodes > 1 && (
                <div className='text-gray-300 text-sm mt-0.5'>
                  第 {currentEpisodeIndex + 1} 集 / 共 {totalEpisodes} 集
                </div>
              )}
            </div>

            {/* 数据源徽章放置在右侧，不影响标题居中 */}
            {detail?.videoInfo?.source_name && (
              <span
                className='absolute right-6 text-gray-300 text-sm border border-gray-500/60 px-2 py-[1px] rounded cursor-pointer hover:bg-gray-600/30 transition-colors'
                onClick={handleSourcePanelOpen}
              >
                {detail.videoInfo.source_name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 快捷键提示 */}
      <div
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 transition-opacity duration-300 ${
          showShortcutHint ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className='bg-black/80 backdrop-blur-sm rounded p-4 flex items-center space-x-3'>
          <svg
            className='w-6 h-6 text-white'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            {shortcutDirection === 'left' && (
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M15 19l-7-7 7-7'
              ></path>
            )}
            {shortcutDirection === 'right' && (
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M9 5l7 7-7 7'
              ></path>
            )}
            {shortcutDirection === 'up' && (
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M5 15l7-7 7 7'
              ></path>
            )}
            {shortcutDirection === 'down' && (
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M19 9l-7 7-7-7'
              ></path>
            )}
          </svg>
          <span className='text-white font-medium'>{shortcutText}</span>
        </div>
      </div>

      {/* 选集侧拉面板 */}
      {totalEpisodes > 1 && (
        <>
          {/* 遮罩层 */}
          {showEpisodePanel && (
            <div
              className='fixed inset-0 bg-black/50 z-[90]'
              onClick={() => setShowEpisodePanel(false)}
            />
          )}

          {/* 侧拉面板 */}
          <div
            className={`fixed top-0 right-0 h-full w-80 bg-black/40 backdrop-blur-xl z-[100] transform transition-transform duration-300 ${
              showEpisodePanel ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className='p-6 h-full flex flex-col'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-white text-xl font-semibold'>选集列表</h3>
                <button
                  onClick={() => setShowEpisodePanel(false)}
                  className='text-gray-400 hover:text-white transition-colors'
                >
                  <svg
                    className='w-6 h-6'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>

              <div className='text-gray-300 text-sm mb-4'>
                当前: 第 {currentEpisodeIndex + 1} 集 / 共 {totalEpisodes} 集
              </div>

              <div className='flex-1 overflow-y-auto'>
                <div className='grid grid-cols-4 gap-3'>
                  {Array.from({ length: totalEpisodes }, (_, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleEpisodeChange(idx)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        idx === currentEpisodeIndex
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 换源侧拉面板 */}
      {showSourcePanel && (
        <>
          {/* 遮罩层 */}
          <div
            className='fixed inset-0 bg-black/50 z-[90]'
            onClick={() => setShowSourcePanel(false)}
          />

          {/* 侧拉面板 */}
          <div
            className={`fixed top-0 right-0 h-full w-96 bg-black/40 backdrop-blur-xl z-[100] transform transition-transform duration-300 ${
              showSourcePanel ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className='p-6 h-full flex flex-col'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-white text-xl font-semibold'>播放源</h3>
                <button
                  onClick={() => setShowSourcePanel(false)}
                  className='text-gray-400 hover:text-white transition-colors'
                >
                  <svg
                    className='w-6 h-6'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>

              {/* 搜索结果 */}
              <div className='flex-1 overflow-y-auto'>
                {searchLoading && (
                  <div className='flex items-center justify-center py-8'>
                    <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500'></div>
                    <span className='text-gray-300 ml-3'>搜索中...</span>
                  </div>
                )}

                {searchError && (
                  <div className='text-red-400 text-center py-4'>
                    {searchError}
                  </div>
                )}

                {!searchLoading &&
                  !searchError &&
                  searchResults.length === 0 && (
                    <div className='text-gray-400 text-center py-8'>
                      未找到相关视频源
                    </div>
                  )}

                {!searchLoading && !searchError && searchResults.length > 0 && (
                  <div className='grid grid-cols-2 gap-4'>
                    {[
                      ...searchResults.filter(
                        (r) =>
                          r.source === currentSource &&
                          String(r.id) === String(currentId)
                      ),
                      ...searchResults.filter(
                        (r) =>
                          !(
                            r.source === currentSource &&
                            String(r.id) === String(currentId)
                          )
                      ),
                    ].map((result) => {
                      const isCurrentSource =
                        result.source === currentSource &&
                        String(result.id) === String(currentId);
                      return (
                        <div
                          key={`${result.source}-${result.id}`}
                          className={`rounded-lg transition-colors border-2 ${
                            isCurrentSource
                              ? 'border-green-500 bg-green-500/20 cursor-not-allowed opacity-60'
                              : 'border-transparent bg-transparent hover:bg-gray-600/30 cursor-pointer'
                          }`}
                          onClick={() =>
                            !isCurrentSource &&
                            handleSourceChange(
                              result.source,
                              result.id,
                              result.title
                            )
                          }
                        >
                          {/* 视频封面 */}
                          <div className='aspect-[2/3] rounded-t-lg overflow-hidden flex items-center justify-center p-1 relative'>
                            <img
                              src={result.poster}
                              alt={result.title}
                              className='w-full h-full object-cover rounded'
                              referrerPolicy='no-referrer'
                            />

                            {/* 集数圆形指示器 */}
                            {result.episodes && (
                              <div className='absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center'>
                                <span className='text-white text-xs font-bold'>
                                  {result.episodes}
                                </span>
                              </div>
                            )}

                            {isCurrentSource && (
                              <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                                <div className='bg-green-500 text-white text-xs px-3 py-1 rounded shadow-lg'>
                                  当前播放
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 视频信息 */}
                          <div className='p-2 bg-transparent text-center'>
                            <h4 className='text-white font-medium text-sm line-clamp-2 mb-2 leading-tight'>
                              {result.title}
                            </h4>
                            <div className='text-gray-400 text-xs space-y-1'>
                              <div className='inline-block border border-gray-500/60 rounded px-2 py-[1px]'>
                                {result.source_name}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense>
      <PlayPageClient />
    </Suspense>
  );
}
