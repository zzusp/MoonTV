'use client';

import { useState } from 'react';

import CapsuleSwitch from '@/components/CapsuleSwitch';
import DemoCard from '@/components/DemoCard';
import PageLayout from '@/components/layout/PageLayout';
import ScrollableRow from '@/components/ScrollableRow';
import VideoCard from '@/components/VideoCard';

const defaultPoster =
  'https://vip.dytt-img.com/upload/vod/20250326-1/9857e2e8581f231e24747ee32e633a3b.jpg';

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

          {/* 最新电影 */}
          <section className='mb-8'>
            <h2 className='mb-4 text-xl font-bold text-gray-800 text-left'>
              最新电影
            </h2>
            <ScrollableRow>
              {mockData.recentMovies.map((movie) => (
                <div key={movie.id} className='min-w-[180px] w-44'>
                  <DemoCard {...movie} />
                </div>
              ))}
            </ScrollableRow>
          </section>

          {/* 最新电视剧 */}
          <section className='mb-8'>
            <h2 className='mb-4 text-xl font-bold text-gray-800 text-left'>
              最新电视剧
            </h2>
            <ScrollableRow>
              {mockData.recentTvShows.map((show) => (
                <div key={show.id} className='min-w-[180px] w-44'>
                  <DemoCard {...show} />
                </div>
              ))}
            </ScrollableRow>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
