'use client';

import { useState } from 'react';

import CapsuleSwitch from '@/components/CapsuleSwitch';
import Sidebar from '@/components/layout/Sidebar';
import SearchCard from '@/components/video/SearchCard';
import VideoCard from '@/components/video/VideoCard';

const defaultPoster =
  'https://vip.dytt-img.com/upload/vod/20250326-1/9857e2e8581f231e24747ee32e633a3b.jpg';

// 模拟数据
const mockData = {
  recentMovies: [
    {
      id: 1,
      title: '流浪地球2',
      poster: defaultPoster,
      rating: 8.3,
      type: 'movie' as const,
      source: '电影天堂',
    },
    {
      id: 2,
      title: '满江红',
      poster: defaultPoster,
      rating: 7.5,
      type: 'movie' as const,
      source: '电影天堂',
    },
  ],
  recentTvShows: [
    {
      id: 3,
      title: '三体',
      poster: defaultPoster,
      rating: 8.7,
      type: 'tv' as const,
      episodes: 30,
      source: '电影天堂',
    },
    {
      id: 4,
      title: '狂飙',
      poster: defaultPoster,
      rating: 8.5,
      type: 'tv' as const,
      episodes: 39,
      source: '电影天堂',
    },
  ],
};

export default function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // 'home' 或 'favorites'

  return (
    <div className='flex min-h-screen'>
      <Sidebar onToggle={setSidebarCollapsed} />

      <main
        className={`flex-1 px-10 py-8 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
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

        {/* 继续观看 */}
        <section className='mb-12'>
          <h2 className='mb-4 text-xl font-bold text-gray-800 text-left'>
            继续观看
          </h2>
          <div className='flex space-x-8 overflow-x-auto pb-2'>
            {[...mockData.recentMovies, ...mockData.recentTvShows]
              .slice(0, 4)
              .map((item) => (
                <div key={item.id} className='min-w-[192px] w-48'>
                  <VideoCard
                    {...item}
                    showProgress={true}
                    progress={Math.random() * 100}
                  />
                </div>
              ))}
          </div>
        </section>

        {/* 最新电影 */}
        <section className='mb-12'>
          <h2 className='mb-4 text-xl font-bold text-gray-800 text-left'>
            最新电影
          </h2>
          <div className='grid grid-cols-5 gap-8'>
            {mockData.recentMovies.map((movie) => (
              <div key={movie.id} className='w-48'>
                <SearchCard {...movie} />
              </div>
            ))}
          </div>
        </section>

        {/* 最新电视剧 */}
        <section className='mb-12'>
          <h2 className='mb-4 text-xl font-bold text-gray-800 text-left'>
            最新电视剧
          </h2>
          <div className='grid grid-cols-5 gap-8'>
            {mockData.recentTvShows.map((show) => (
              <div key={show.id} className='w-48'>
                <SearchCard {...show} />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
