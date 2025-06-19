'use client';

import {
  Film,
  MessageCircleHeart,
  MountainSnow,
  Star,
  Swords,
  Tv,
  VenetianMask,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import CapsuleSwitch from '@/components/CapsuleSwitch';
import CollectionCard from '@/components/CollectionCard';
import ContinueWatching from '@/components/ContinueWatching';
import DemoCard from '@/components/DemoCard';
import PageLayout from '@/components/layout/PageLayout';
import ScrollableRow from '@/components/ScrollableRow';

interface DoubanItem {
  title: string;
  poster: string;
}

interface DoubanResponse {
  code: number;
  message: string;
  list: DoubanItem[];
}

// 合集数据
const collections = [
  {
    icon: Film,
    title: '热门电影',
    href: '/douban?type=movie&tag=热门&title=热门电影',
  },
  {
    icon: Tv,
    title: '热门剧集',
    href: '/douban?type=tv&tag=热门&title=热门剧集',
  },
  {
    icon: Star,
    title: '豆瓣 Top250',
    href: '/douban?type=movie&tag=top250&title=豆瓣 Top250',
  },
  { icon: Swords, title: '美剧', href: '/douban?type=tv&tag=美剧' },
  { icon: MessageCircleHeart, title: '韩剧', href: '/douban?type=tv&tag=韩剧' },
  { icon: MountainSnow, title: '日剧', href: '/douban?type=tv&tag=日剧' },
  { icon: VenetianMask, title: '日漫', href: '/douban?type=tv&tag=日本动画' },
];

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
          {/* 推荐 */}
          <section className='mb-8'>
            <h2 className='mb-4 text-xl font-bold text-gray-800 text-left'>
              推荐
            </h2>
            <ScrollableRow scrollDistance={800}>
              {collections.map((collection) => (
                <div key={collection.title} className='min-w-[280px] w-72'>
                  <CollectionCard
                    title={collection.title}
                    icon={collection.icon}
                    href={collection.href}
                  />
                </div>
              ))}
            </ScrollableRow>
          </section>

          {/* 继续观看 */}
          <ContinueWatching />

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
