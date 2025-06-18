'use client';

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import PageLayout from '@/components/layout/PageLayout';

import { VideoDetail } from '../api/detail/route';

export default function DetailPage() {
  const searchParams = useSearchParams();
  const [detail, setDetail] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const source = searchParams.get('source');
    const id = searchParams.get('id');

    if (!source || !id) {
      setError('缺少必要参数');
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      try {
        const response = await fetch(`/api/detail?source=${source}&id=${id}`);
        if (!response.ok) {
          throw new Error('获取详情失败');
        }
        const data = await response.json();
        setDetail(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [searchParams]);

  return (
    <PageLayout activePath='/detail'>
      <div className='px-10 py-8 overflow-visible'>
        {/* 顶部返回按钮已移入右侧信息容器 */}
        {loading ? (
          <div className='flex items-center justify-center min-h-[60vh]'>
            <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
          </div>
        ) : error ? (
          <div className='flex items-center justify-center min-h-[60vh]'>
            <div className='text-red-500 text-center'>
              <div className='text-lg font-semibold mb-2'>加载失败</div>
              <div className='text-sm'>{error}</div>
            </div>
          </div>
        ) : !detail ? (
          <div className='flex items-center justify-center min-h-[60vh]'>
            <div className='text-gray-500 text-center'>
              <div className='text-lg font-semibold mb-2'>未找到视频详情</div>
            </div>
          </div>
        ) : (
          <div className='max-w-[95%] mx-auto'>
            {/* 主信息区：左图右文 */}
            <div className='relative flex flex-col md:flex-row gap-8 mb-8 bg-transparent rounded-xl p-6 md:items-start'>
              {/* 返回按钮放置在主信息区左上角 */}
              <button
                onClick={() => {
                  const from = searchParams.get('from');
                  if (from === 'search') {
                    window.history.back();
                  } else {
                    window.location.href = '/';
                  }
                }}
                className='absolute top-0 left-0 -translate-x-[180%] -translate-y-1/2 p-2 rounded transition-colors'
              >
                <svg
                  className='h-5 w-5 text-gray-500 hover:text-green-600 transition-colors'
                  viewBox='0 0 24 24'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    d='M15 19l-7-7 7-7'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </button>
              {/* 封面 */}
              <div className='flex-shrink-0 w-full md:w-64'>
                <Image
                  src={detail.videoInfo.cover || '/images/placeholder.png'}
                  alt={detail.videoInfo.title}
                  width={256}
                  height={384}
                  className='w-full rounded-xl object-cover'
                  style={{ aspectRatio: '2/3' }}
                  priority
                />
              </div>
              {/* 右侧信息 */}
              <div
                className='flex-1 flex flex-col min-h-0'
                style={{ height: '384px' }}
              >
                <h1 className='text-3xl font-bold mb-2 tracking-wide flex items-center flex-shrink-0'>
                  {detail.videoInfo.title}
                </h1>
                <div className='flex flex-wrap items-center gap-3 text-base mb-4 opacity-80 flex-shrink-0'>
                  {detail.videoInfo.remarks && (
                    <span className='text-green-600 font-semibold'>
                      {detail.videoInfo.remarks}
                    </span>
                  )}
                  {detail.videoInfo.year && (
                    <span>{detail.videoInfo.year}</span>
                  )}
                  {detail.videoInfo.source_name && (
                    <span>{detail.videoInfo.source_name}</span>
                  )}
                  {detail.videoInfo.type && (
                    <span>{detail.videoInfo.type}</span>
                  )}
                </div>
                <div className='flex items-center gap-4 mb-4 flex-shrink-0'>
                  <a
                    href={`/play?source=${searchParams.get(
                      'source'
                    )}&id=${searchParams.get('id')}`}
                    className='flex items-center justify-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors text-white'
                  >
                    <div className='w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent'></div>
                    <span>播放</span>
                  </a>
                  <button className='flex items-center justify-center w-10 h-10 bg-pink-400 hover:bg-pink-500 rounded-full transition-colors'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-5 w-5 text-white'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
                      />
                    </svg>
                  </button>
                </div>
                {detail.videoInfo.desc && (
                  <div
                    className='mt-4 text-base leading-relaxed opacity-90 overflow-y-auto pr-2 flex-1 min-h-0 scrollbar-hide'
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    {detail.videoInfo.desc}
                  </div>
                )}
              </div>
            </div>
            {/* 选集按钮区 */}
            {detail.episodes.length > 0 && (
              <div className='mt-8 bg-transparent rounded-xl p-6'>
                <div className='flex items-center gap-2 mb-4'>
                  <div className='text-xl font-semibold'>选集</div>
                  <div className='text-gray-400 ml-2'>
                    共 {detail.episodes.length} 集
                  </div>
                </div>
                <div className='flex flex-wrap gap-4'>
                  {detail.episodes.map((episode, idx) => (
                    <a
                      key={idx}
                      href={`/play?source=${searchParams.get(
                        'source'
                      )}&id=${searchParams.get('id')}&index=${idx + 1}`}
                      className='bg-gray-500/80 hover:bg-green-500 text-white px-5 py-2 rounded-lg transition-colors text-base font-medium w-24 text-center'
                    >
                      第{idx + 1}集
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
