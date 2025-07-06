/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, no-console, @next/next/no-img-element */

'use client';

import { Suspense, useEffect, useRef } from 'react';

import 'xgplayer/dist/index.min.css';

import EpisodeSelector from '@/components/EpisodeSelector';
import PageLayout from '@/components/PageLayout';

function PlayPageClient() {
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const initPlayer = async () => {
      try {
        // 动态导入 xgplayer 和 HLS 插件
        const [{ default: Player }, { default: HLS }] = await Promise.all([
          import('xgplayer'),
          import('xgplayer-hls.js'),
        ]);

        console.log('Player:', Player);
        console.log('HLS Plugin:', HLS);

        // 初始化 xgplayer
        const player = new Player({
          id: 'player-container',
          // 示例 HLS 流地址，您可以根据需要替换
          url: 'https://vip.dytt-cinema.com/20250607/24158_8e0c4a20/index.m3u8',
          width: '100%',
          height: '100%',
          // 播放器配置
          autoplay: true,
          preload: 'auto',
          // 禁用响应式设计，保持原始大小
          fluid: false,
          // 保持视频原始尺寸和宽高比
          videoFillMode: 'contain',
          // 禁用自动调整尺寸
          autoResize: false,
          // 保持原始视频比例
          aspectRatio: 'auto',
          // 控制栏配置
          controls: true,
          // 海报图片
          poster: '',
          // 其他配置
          playsinline: true,
          lang: 'zh-cn',
          volume: 0.8,
          // 插件配置 - 注册 HLS 插件
          plugins: [HLS],
          // HLS 特定配置
          hls: {
            // 使用 hls.js 引擎
            enableWorker: true,
            // 预加载配置
            maxBufferLength: 30,
            maxBufferSize: 60 * 1000 * 1000,
            // 错误处理
            enableSoftwareAES: true,
            debug: process.env.NODE_ENV === 'development',
            // 自适应码率
            enableLowInitialPlaylist: false,
            // 跨域配置
            withCredentials: false,
            // 错误恢复
            maxMaxBufferLength: 600,
            backBufferLength: 90,
            // 性能优化
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: 10,
          },
        });

        // 保存播放器实例
        playerRef.current = player;

        // 添加事件监听器
        player.on('ready', () => {
          console.log('播放器已准备就绪');
        });

        player.on('play', () => {
          console.log('开始播放');
        });

        player.on('pause', () => {
          console.log('暂停播放');
        });

        player.on('error', (err: any) => {
          console.error('播放器错误:', err);
        });

        // HLS 特定事件
        player.on('hls_manifest_parsed', () => {
          console.log('HLS 清单解析完成');
        });

        player.on('hls_level_switched', (event: any) => {
          console.log('HLS 质量切换:', event);
        });

        player.on('hls_media_attached', () => {
          console.log('HLS 媒体已附加');
        });

        player.on('hls_manifest_loaded', () => {
          console.log('HLS 清单已加载');
        });

        player.on('hls_level_loaded', () => {
          console.log('HLS 级别已加载');
        });

        player.on('hls_frag_loaded', () => {
          console.log('HLS 片段已加载');
        });

        player.on('hls_error', (err: any) => {
          console.error('HLS 错误:', err);
        });
      } catch (error) {
        console.error('初始化播放器失败:', error);
      }
    };

    // 初始化播放器
    initPlayer();

    // 清理函数
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (error) {
          console.error('销毁播放器失败:', error);
        }
      }
    };
  }, []);

  return (
    <PageLayout activePath='/play'>
      <div className='flex flex-col gap-6 py-4 px-10 md:px-32'>
        {/* 第一行：影片标题 */}
        <div className='py-1'>
          <h1 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
            影片标题
          </h1>
        </div>

        {/* 第二行：播放器和选集 */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 md:h-[650px]'>
          {/* 播放器 */}
          <div className='md:col-span-3 h-[400px] md:h-full'>
            <div
              id='player-container'
              className='bg-black w-full h-full rounded-lg dark:border dark:border-white/10'
            ></div>
          </div>

          {/* 选集 */}
          <div className='md:col-span-1 h-full md:overflow-hidden'>
            <EpisodeSelector totalEpisodes={300} />
          </div>
        </div>

        {/* 海报（移动端在上方） */}
        <div className='block md:hidden'>
          <div className='p-4'>
            <div className='bg-gray-300 dark:bg-gray-700 aspect-[3/4] max-w-xs mx-auto flex items-center justify-center'>
              <span className='text-gray-600 dark:text-gray-400'>封面图片</span>
            </div>
          </div>
        </div>

        {/* 详情展示 */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          {/* 文字区 */}
          <div className='md:col-span-3'>
            <div className='p-6'>
              <h2 className='text-2xl font-bold mb-4'>影片详情</h2>
              <div className='space-y-4'>
                <div>
                  <h3 className='font-semibold text-lg mb-2'>剧情简介</h3>
                  <p className='text-gray-700 dark:text-gray-300 leading-relaxed'>
                    这里是影片的详细剧情介绍。可以包含影片的背景、故事梗概、主要人物关系等信息。
                    文字内容可以根据实际的影片数据动态显示。
                  </p>
                </div>
                <div>
                  <h3 className='font-semibold text-lg mb-2'>基本信息</h3>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <span className='font-medium'>导演：</span>
                      <span className='text-gray-700 dark:text-gray-300'>
                        待获取
                      </span>
                    </div>
                    <div>
                      <span className='font-medium'>主演：</span>
                      <span className='text-gray-700 dark:text-gray-300'>
                        待获取
                      </span>
                    </div>
                    <div>
                      <span className='font-medium'>类型：</span>
                      <span className='text-gray-700 dark:text-gray-300'>
                        待获取
                      </span>
                    </div>
                    <div>
                      <span className='font-medium'>年份：</span>
                      <span className='text-gray-700 dark:text-gray-300'>
                        待获取
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 封面展示（桌面端在右侧） */}
          <div className='hidden md:block md:col-span-1'>
            <div className='p-4'>
              <div className='bg-gray-300 dark:bg-gray-700 aspect-[3/4] flex items-center justify-center'>
                <span className='text-gray-600 dark:text-gray-400'>
                  封面图片
                </span>
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
    <Suspense>
      <PlayPageClient />
    </Suspense>
  );
}
