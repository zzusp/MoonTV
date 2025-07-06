/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, no-console, @next/next/no-img-element */

'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';

import {
  generateStorageKey,
  getAllPlayRecords,
  savePlayRecord,
} from '@/lib/db.client';
import {
  type VideoDetail,
  fetchVideoDetail,
} from '@/lib/fetchVideoDetail.client';

import EpisodeSelector from '@/components/EpisodeSelector';
import PageLayout from '@/components/PageLayout';

function PlayPageClient() {
  const searchParams = useSearchParams();

  // 状态管理
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<VideoDetail | null>(null);

  // 视频基本信息
  const [videoTitle, setVideoTitle] = useState(searchParams.get('title') || '');
  const videoYear = searchParams.get('year') || '';
  const [videoCover, setVideoCover] = useState('');

  // 当前源和ID
  const [currentSource, setCurrentSource] = useState(
    searchParams.get('source') || ''
  );
  const [currentId, setCurrentId] = useState(searchParams.get('id') || '');

  // 集数相关
  const initialIndex = parseInt(searchParams.get('index') || '1') - 1; // 转换为0基数组索引
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(initialIndex);

  // 视频播放地址
  const [videoUrl, setVideoUrl] = useState('');

  // 总集数
  const totalEpisodes = detail?.episodes?.length || 0;

  // 用于记录是否需要在播放器 ready 后跳转到指定进度
  const resumeTimeRef = useRef<number | null>(null);

  const currentSourceRef = useRef(currentSource);
  const currentIdRef = useRef(currentId);
  const videoTitleRef = useRef(videoTitle);

  // 同步最新值到 refs
  useEffect(() => {
    currentSourceRef.current = currentSource;
    currentIdRef.current = currentId;
    detailRef.current = detail;
    currentEpisodeIndexRef.current = currentEpisodeIndex;
    videoTitleRef.current = videoTitle;
  }, [currentSource, currentId, detail, currentEpisodeIndex, videoTitle]);

  // 播放进度保存相关
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoEventListenersRef = useRef<{
    video: HTMLVideoElement;
    listeners: Array<{ event: string; handler: EventListener }>;
  } | null>(null);

  // 动态导入的 Artplayer 与 Hls 实例
  const [{ Artplayer, Hls }, setPlayers] = useState<{
    Artplayer: any | null;
    Hls: any | null;
  }>({ Artplayer: null, Hls: null });
  const artPlayerRef = useRef<any>(null);
  const artRef = useRef<HTMLDivElement | null>(null);

  // 添加缺少的状态和 ref
  const detailRef = useRef<VideoDetail | null>(detail);
  const currentEpisodeIndexRef = useRef(currentEpisodeIndex);

  // 同步状态到 ref
  useEffect(() => {
    detailRef.current = detail;
    currentEpisodeIndexRef.current = currentEpisodeIndex;
  }, [detail, currentEpisodeIndex]);

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

  // 更新视频地址
  const updateVideoUrl = (
    detailData: VideoDetail | null,
    episodeIndex: number
  ) => {
    if (
      !detailData ||
      !detailData.episodes ||
      episodeIndex >= detailData.episodes.length
    ) {
      setVideoUrl('');
      return;
    }
    const newUrl = detailData?.episodes[episodeIndex] || '';
    if (newUrl !== videoUrl) {
      setVideoUrl(newUrl);
    }
  };

  const ensureVideoSource = (video: HTMLVideoElement | null, url: string) => {
    if (!video || !url) return;
    const sources = Array.from(video.getElementsByTagName('source'));
    const existed = sources.some((s) => s.src === url);
    if (!existed) {
      // 移除旧的 source，保持唯一
      sources.forEach((s) => s.remove());
      const sourceEl = document.createElement('source');
      sourceEl.src = url;
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

  // 获取视频详情
  useEffect(() => {
    if (!currentSource || !currentId) {
      setError('缺少必要参数');
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      try {
        const detailData = await fetchVideoDetail({
          source: currentSource,
          id: currentId,
          fallbackTitle: videoTitle.trim(),
          fallbackYear: videoYear,
        });

        // 更新状态保存详情
        setVideoTitle(detailData.title || videoTitle);
        setVideoCover(detailData.poster);
        setDetail(detailData);

        // 确保集数索引在有效范围内
        if (currentEpisodeIndex >= detailData.episodes.length) {
          console.log('currentEpisodeIndex', currentEpisodeIndex);
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

  // 播放记录处理
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
  }, []);

  // 处理集数切换
  const handleEpisodeChange = (episodeNumber: number) => {
    if (episodeNumber >= 0 && episodeNumber < totalEpisodes) {
      // 在更换集数前保存当前播放进度
      if (
        artPlayerRef.current &&
        artPlayerRef.current.video &&
        !artPlayerRef.current.video.paused
      ) {
        saveCurrentPlayProgress();
      }
      setCurrentEpisodeIndex(episodeNumber);
    }
  };

  const handleNextEpisode = () => {
    const d = detailRef.current;
    const idx = currentEpisodeIndexRef.current;
    if (d && d.episodes && idx < d.episodes.length - 1) {
      if (
        artPlayerRef.current &&
        artPlayerRef.current.video &&
        !artPlayerRef.current.video.paused
      ) {
        saveCurrentPlayProgress();
      }
      setCurrentEpisodeIndex(idx + 1);
    }
  };

  // 保存播放进度
  const saveCurrentPlayProgress = async () => {
    if (
      !artPlayerRef.current ||
      !currentSourceRef.current ||
      !currentIdRef.current ||
      !videoTitleRef.current ||
      !detailRef.current?.source_name
    ) {
      return;
    }

    const player = artPlayerRef.current;
    const currentTime = player.currentTime || 0;
    const duration = player.duration || 0;

    // 如果播放时间太短（少于5秒）或者视频时长无效，不保存
    if (currentTime < 1 || !duration) {
      return;
    }

    try {
      await savePlayRecord(currentSource, currentId, {
        title: videoTitleRef.current,
        source_name: detailRef.current?.source_name || '',
        year: videoYear || detailRef.current?.year || '',
        cover: videoCover,
        index: currentEpisodeIndex + 1, // 转换为1基索引
        total_episodes: totalEpisodes,
        play_time: Math.floor(currentTime),
        total_time: Math.floor(duration),
        save_time: Date.now(),
      });
      console.log('播放进度已保存:', {
        title: videoTitleRef.current,
        episode: currentEpisodeIndexRef.current + 1,
        progress: `${Math.floor(currentTime)}/${Math.floor(duration)}`,
      });
    } catch (err) {
      console.error('保存播放进度失败:', err);
    }
  };

  useLayoutEffect(() => {
    const container = document.getElementById(
      'artplayer-container'
    ) as HTMLDivElement;

    if (
      !Artplayer ||
      !Hls ||
      !videoUrl ||
      loading ||
      currentEpisodeIndex === null ||
      !container
    ) {
      return;
    }

    artRef.current = container;

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
        console.log('attachVideoEventListeners');
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
      Artplayer.PLAYBACK_RATE = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
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
        theme: '#22c55e',
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

            if (video.hls) {
              video.hls.destroy();
            }
            const hls = new Hls({
              debug: false, // 关闭日志
              enableWorker: true, // WebWorker 解码，降低主线程压力
              lowLatencyMode: true, // 开启低延迟 LL-HLS

              /* 缓冲/内存相关 */
              maxBufferLength: 30, // 前向缓冲最大 30s，过大容易导致高延迟
              backBufferLength: 30, // 仅保留 30s 已播放内容，避免内存占用
              maxBufferSize: 60 * 1000 * 1000, // 约 60MB，超出后触发清理
            });

            hls.loadSource(url);
            hls.attachMedia(video);
            video.hls = hls;

            ensureVideoSource(video, url);

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
            index: 13,
            html: '<i class="art-icon flex"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" fill="currentColor"/></svg></i>',
            tooltip: '播放下一集',
            click: function () {
              handleNextEpisode();
            },
          },
        ],
      });

      // 监听播放器事件
      artPlayerRef.current.on('ready', () => {
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
        const d = detailRef.current;
        const idx = currentEpisodeIndexRef.current;
        if (d && d.episodes && idx < d.episodes.length - 1) {
          setTimeout(() => {
            setCurrentEpisodeIndex(idx + 1);
          }, 1000);
        }
      });
      if (artPlayerRef.current?.video) {
        console.log('attachVideoEventListeners');
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

    // 阻止移动端长按弹出系统菜单
    const contextMenuHandler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
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
    video.addEventListener('contextmenu', contextMenuHandler);

    videoEventListenersRef.current = {
      video,
      listeners: [
        { event: 'pause', handler: pauseHandler },
        { event: 'timeupdate', handler: timeUpdateHandler },
        { event: 'contextmenu', handler: contextMenuHandler },
      ],
    };
  };

  // 当组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <PageLayout activePath='/play'>
        <div className='flex items-center justify-center h-screen'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto mb-4'></div>
            <p className='text-lg text-gray-600 dark:text-gray-300'>
              加载中...
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout activePath='/play'>
        <div className='flex items-center justify-center h-screen'>
          <div className='text-center'>
            <div className='text-red-500 text-6xl mb-4'>⚠️</div>
            <p className='text-lg text-red-600 dark:text-red-400 mb-4'>
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className='px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors'
            >
              重试
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout activePath='/play'>
      <div className='flex flex-col gap-6 py-4 px-10 md:px-24'>
        {/* 第一行：影片标题 */}
        <div className='py-1'>
          <h1 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
            {videoTitle || '影片标题'}
          </h1>
        </div>
        {/* 第二行：播放器和选集 */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 md:h-[650px]'>
          {/* 播放器 */}
          <div className='md:col-span-3 h-[400px] md:h-full'>
            <div
              id='artplayer-container'
              className='bg-black w-full h-full rounded-2xl overflow-hidden border border-white/10'
            ></div>
          </div>

          {/* 选集 */}
          <div className='md:col-span-1 h-full md:overflow-hidden'>
            <EpisodeSelector
              totalEpisodes={totalEpisodes}
              value={currentEpisodeIndex + 1}
              onChange={handleEpisodeChange}
            />
          </div>
        </div>

        {/* 详情展示 */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          {/* 文字区 */}
          <div className='md:col-span-3'>
            <div className='p-6 flex flex-col min-h-0'>
              {/* 标题 */}
              <h1 className='text-3xl font-bold mb-2 tracking-wide flex items-center flex-shrink-0 text-center md:text-left w-full'>
                {videoTitle || '影片标题'}
              </h1>

              {/* 关键信息行 */}
              <div className='flex flex-wrap items-center gap-3 text-base mb-4 opacity-80 flex-shrink-0'>
                {detail?.class && (
                  <span className='text-green-600 font-semibold'>
                    {detail.class}
                  </span>
                )}
                {(detail?.year || videoYear) && (
                  <span>{detail?.year || videoYear}</span>
                )}
                {detail?.source_name && (
                  <span className='border border-gray-500/60 px-2 py-[1px] rounded'>
                    {detail.source_name}
                  </span>
                )}
                {detail?.type_name && <span>{detail.type_name}</span>}
              </div>
              {/* 剧情简介 */}
              {detail?.desc && (
                <div
                  className='mt-0 text-base leading-relaxed opacity-90 overflow-y-auto pr-2 flex-1 min-h-0 scrollbar-hide'
                  style={{ whiteSpace: 'pre-line' }}
                >
                  {detail.desc}
                </div>
              )}
            </div>
          </div>

          {/* 封面展示 */}
          <div className='hidden md:block md:col-span-1 md:order-first'>
            <div className='pl-0 py-4 pr-6'>
              <div className='bg-gray-300 dark:bg-gray-700 aspect-[3/4] flex items-center justify-center rounded-2xl overflow-hidden'>
                {videoCover ? (
                  <img
                    src={videoCover}
                    alt={videoTitle}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <span className='text-gray-600 dark:text-gray-400'>
                    封面图片
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlayPageClient />
    </Suspense>
  );
}
