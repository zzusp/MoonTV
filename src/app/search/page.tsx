'use client';

import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import VideoCard from '@/components/card/VideoCard';
import Sidebar from '@/components/layout/Sidebar';

// 模拟搜索历史数据
const mockSearchHistory = ['流浪地球', '三体', '狂飙', '满江红'];

// 模拟搜索结果数据
const mockSearchResults = [
  {
    id: 1,
    title: '流浪地球2',
    poster:
      'https://vip.dytt-img.com/upload/vod/20250326-1/9857e2e8581f231e24747ee32e633a3b.jpg',
    type: 'movie' as const,
    source: '电影天堂',
  },
  {
    id: 2,
    title: '三体',
    poster:
      'https://vip.dytt-img.com/upload/vod/20250326-1/9857e2e8581f231e24747ee32e633a3b.jpg',
    type: 'tv' as const,
    episodes: 30,
    source: '电影天堂',
  },
];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState<typeof mockSearchResults>(
    []
  );
  const [showResults, setShowResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 自动聚焦搜索框
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    // 当搜索参数变化时更新搜索状态
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      // 这里应该调用实际的搜索 API
      setSearchResults(mockSearchResults);
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className='flex min-h-screen'>
      <Sidebar onToggle={setSidebarCollapsed} activePath='/search' />

      <main
        className={`flex-1 px-10 py-8 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        {/* 搜索框 */}
        <div className='mb-8'>
          <form onSubmit={handleSearch} className='max-w-2xl mx-auto'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400' />
              <input
                ref={searchInputRef}
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='搜索电影、电视剧...'
                className='w-full h-12 rounded-lg bg-gray-50/80 py-3 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white border border-gray-200/50 shadow-sm'
              />
            </div>
          </form>
        </div>

        {/* 搜索结果或搜索历史 */}
        <div className='max-w-7xl mx-auto mt-12'>
          {showResults ? (
            // 搜索结果
            <div className='grid grid-cols-5 gap-7'>
              {searchResults.map((item) => (
                <div key={item.id} className='w-44'>
                  <VideoCard {...item} />
                </div>
              ))}
            </div>
          ) : mockSearchHistory.length > 0 ? (
            // 搜索历史
            <section className='mb-12'>
              <h2 className='mb-4 text-xl font-bold text-gray-800 text-left'>
                搜索历史
              </h2>
              <div className='flex flex-wrap gap-2'>
                {mockSearchHistory.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchQuery(item);
                      router.push(`/search?q=${encodeURIComponent(item)}`);
                    }}
                    className='px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors duration-200'
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
