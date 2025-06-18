'use client';

import { useEffect, useState } from 'react';

import CapsuleSwitch from '@/components/CapsuleSwitch';
import DemoCard from '@/components/DemoCard';
import PageLayout from '@/components/layout/PageLayout';
import ScrollableRow from '@/components/ScrollableRow';
import VideoCard from '@/components/VideoCard';

const defaultPoster =
  'https://vip.dytt-img.com/upload/vod/20250326-1/9857e2e8581f231e24747ee32e633a3b.jpg';

interface DoubanItem {
  title: string;
  poster: string;
}

interface DoubanResponse {
  code: number;
  message: string;
  list: DoubanItem[];
}

// 模拟数据
const mockData = {
  recentMovies: [
    {
      id: '1',
      title: '流浪地球2',
      poster: defaultPoster,
      source: 'dyttzy',
      source_name: '电影天堂',
    },
    {
      id: '2',
      title: '满江红',
      poster: defaultPoster,
      source: 'dyttzy',
      source_name: '电影天堂',
    },
  ],
  recentTvShows: [
    {
      id: '3',
      title: '三体',
      poster: defaultPoster,
      source: 'dyttzy',
      source_name: '电影天堂',
      episodes: 30,
    },
    {
      id: '4',
      title: '狂飙',
      poster: defaultPoster,
      episodes: 39,
      source: 'dyttzy',
      source_name: '电影天堂',
    },
    {
      id: '332',
      title: '三体',
      poster: defaultPoster,
      source: 'dyttzy',
      source_name: '电影天堂',
      episodes: 30,
    },
    {
      id: '4231',
      title: '狂飙',
      poster: defaultPoster,
      episodes: 39,
      source: 'dyttzy',
      source_name: '电影天堂',
    },
    {
      id: '3342',
      title: '三体',
      poster: defaultPoster,
      source: 'dyttzy',
      source_name: '电影天堂',
      episodes: 30,
    },
    {
      id: '8',
      title: '狂飙',
      poster: defaultPoster,
      episodes: 39,
      source: 'dyttzy',
      source_name: '电影天堂',
    },
  ],
};

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [hotMovies, setHotMovies] = useState<DoubanItem[]>([]);
  const [hotTvShows, setHotTvShows] = useState<DoubanItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoubanData = async () => {
      try {
        setLoading(true);

        // 并行获取热门电影和热门剧集
        const [moviesResponse, tvShowsResponse] = await Promise.all([
          fetch('/api/douban?type=movie&tag=热门'),
          fetch('/api/douban?type=tv&tag=热门'),
        ]);

        if (moviesResponse.ok) {
          const moviesData: DoubanResponse = await moviesResponse.json();
          setHotMovies(moviesData.list);
        }

        if (tvShowsResponse.ok) {
          const tvShowsData: DoubanResponse = await tvShowsResponse.json();
          setHotTvShows(tvShowsData.list);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDoubanData();
  }, []);

  return (
    <PageLayout>
      <div className='px-10 py-8'>
        {/* 顶部 Tab 切换 */}
        <div className='mb-8 flex justify-center'>
          <CapsuleSwitch
            options={[
              { label: '首页', value: 'home' },
              { label: '收藏夹', value: 'favorites' },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />
        </div>

        <div className='max-w-[95%] mx-auto'>
          {/* 继续观看 */}
          <section className='mb-8'>
            <h2 className='mb-4 text-xl font-bold text-gray-800 text-left'>
              继续观看
            </h2>
            <ScrollableRow>
              {[...mockData.recentMovies, ...mockData.recentTvShows].map(
                (item) => (
                  <div key={item.id} className='min-w-[180px] w-44'>
                    <VideoCard {...item} progress={Math.random() * 100} />
                  </div>
                )
              )}
            </ScrollableRow>
          </section>

          {/* 热门电影 */}
          <section className='mb-8'>
            <h2 className='mb-4 text-xl font-bold text-gray-800 text-left'>
              热门电影
            </h2>
            <ScrollableRow>
              {loading
                ? // 加载状态显示灰色占位数据
                  Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className='min-w-[180px] w-44'>
                      <div className='relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-gray-200 animate-pulse'>
                        <div className='absolute inset-0 bg-gray-300'></div>
                      </div>
                      <div className='mt-2 h-4 bg-gray-200 rounded animate-pulse'></div>
                    </div>
                  ))
                : // 显示真实数据
                  hotMovies.map((movie, index) => (
                    <div key={index} className='min-w-[180px] w-44'>
                      <DemoCard title={movie.title} poster={movie.poster} />
                    </div>
                  ))}
            </ScrollableRow>
          </section>

          {/* 热门剧集 */}
          <section className='mb-8'>
            <h2 className='mb-4 text-xl font-bold text-gray-800 text-left'>
              热门剧集
            </h2>
            <ScrollableRow>
              {loading
                ? // 加载状态显示灰色占位数据
                  Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className='min-w-[180px] w-44'>
                      <div className='relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-gray-200 animate-pulse'>
                        <div className='absolute inset-0 bg-gray-300'></div>
                      </div>
                      <div className='mt-2 h-4 bg-gray-200 rounded animate-pulse'></div>
                    </div>
                  ))
                : // 显示真实数据
                  hotTvShows.map((show, index) => (
                    <div key={index} className='min-w-[180px] w-44'>
                      <DemoCard title={show.title} poster={show.poster} />
                    </div>
                  ))}
            </ScrollableRow>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
