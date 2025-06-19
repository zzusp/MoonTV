'use client';

import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import PageLayout from '@/components/PageLayout';
import VideoCard from '@/components/VideoCard';

// 模拟搜索历史数据
const mockSearchHistory = ['流浪地球', '三体', '狂飙', '满江红'];

// 定义搜索结果类型
type SearchResult = {
  id: string;
  title: string;
  poster: string;
  source: string;
  source_name: string;
  episodes?: number;
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
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
      fetchSearchResults(query);
    } else {
      setShowResults(false);
    }
  }, [searchParams]);

  const fetchSearchResults = async (query: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSearchResults(data.results);
      setShowResults(true);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setShowResults(true);
    // 模拟搜索延迟
    setTimeout(() => {
      fetchSearchResults(searchQuery);
    }, 1000);
  };

  return (
    <PageLayout activePath='/search'>
      <div className='px-10 py-8 overflow-visible'>
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
        <div className='max-w-[95%] mx-auto mt-12 overflow-visible'>
          {isLoading ? (
            <div className='flex justify-center items-center h-40'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-500'></div>
            </div>
          ) : showResults ? (
            // 搜索结果
            <div className='grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-8 gap-y-20 px-4'>
              {searchResults.map((item) => (
                <div key={item.id} className='w-44'>
                  <VideoCard {...item} from='search' />
                </div>
              ))}
              {searchResults.length === 0 && (
                <div className='col-span-full text-center text-gray-500 py-8'>
                  未找到相关结果
                </div>
              )}
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
      </div>
    </PageLayout>
  );
}
