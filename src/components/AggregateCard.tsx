import { LinkIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

// 聚合卡需要的基本字段，与搜索接口保持一致
interface SearchResult {
  id: string;
  title: string;
  poster: string;
  source: string;
  source_name: string;
  douban_id?: number;
  episodes: string[];
}

interface AggregateCardProps {
  /** 同一标题下的多个搜索结果 */
  query?: string;
  year?: string;
  items: SearchResult[];
}

function PlayCircleSolid({
  className = '',
  fillColor = 'none',
}: {
  className?: string;
  fillColor?: string;
}) {
  return (
    <svg
      width='44'
      height='44'
      viewBox='0 0 44 44'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
    >
      <circle
        cx='22'
        cy='22'
        r='20'
        stroke='white'
        strokeWidth='1.5'
        fill={fillColor}
      />
      <polygon points='19,15 19,29 29,22' fill='white' />
    </svg>
  );
}

/**
 * 与 `VideoCard` 基本一致，删除了集数徽标、来源标签、收藏等功能
 * 点击播放按钮 -> 跳到第一个源播放
 * 点击卡片其他区域 -> 跳到聚合详情页 (/aggregate)
 */
const AggregateCard: React.FC<AggregateCardProps> = ({
  query = '',
  year = 0,
  items,
}) => {
  // 使用列表中的第一个结果做展示 & 播放
  const first = items[0];
  const [playHover, setPlayHover] = useState(false);
  const router = useRouter();

  // 统计 items 中出现次数最多的（非 0） douban_id，用于跳转豆瓣页面
  const mostFrequentDoubanId = useMemo(() => {
    const countMap = new Map<number, number>();

    items.forEach((item) => {
      if (item.douban_id && item.douban_id !== 0) {
        countMap.set(item.douban_id, (countMap.get(item.douban_id) || 0) + 1);
      }
    });

    let selectedId: number | undefined;
    let maxCount = 0;

    countMap.forEach((cnt, id) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        selectedId = id;
      }
    });

    return selectedId;
  }, [items]);

  // 统计出现次数最多的集数（episodes.length），主要用于显示剧集数徽标
  const mostFrequentEpisodes = useMemo(() => {
    const countMap = new Map<number, number>();

    items.forEach((item) => {
      const len = item.episodes?.length || 0;
      if (len > 0) {
        countMap.set(len, (countMap.get(len) || 0) + 1);
      }
    });

    let selectedLen = 0;
    let maxCount = 0;

    countMap.forEach((cnt, len) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        selectedLen = len;
      }
    });

    return selectedLen;
  }, [items]);

  return (
    <Link
      href={`/aggregate?q=${encodeURIComponent(
        query
      )}&title=${encodeURIComponent(first.title)}${
        year ? `&year=${encodeURIComponent(year)}` : ''
      }&type=${mostFrequentEpisodes > 1 ? 'tv' : 'movie'}`}
    >
      <div className='group relative w-full rounded-lg bg-transparent shadow-none flex flex-col'>
        {/* 封面图片 2:3 */}
        <div className='relative aspect-[2/3] w-full overflow-hidden rounded-md'>
          <Image
            src={first.poster}
            alt={first.title}
            fill
            className='object-cover'
            unoptimized
          />

          {/* 集数指示器 - 绿色小圆球 */}
          {mostFrequentEpisodes && mostFrequentEpisodes > 1 && (
            <div className='absolute top-2 right-2 w-4 h-4 sm:w-7 sm:h-7 bg-green-500 rounded-full flex items-center justify-center'>
              <span className='text-white text-[0.5rem] sm:text-xs font-bold'>
                {mostFrequentEpisodes}
              </span>
            </div>
          )}

          {/* Hover 层 & 播放按钮 */}
          <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none'>
            <div className='absolute inset-0 flex items-center justify-center pointer-events-auto'>
              <div
                className={`transition-all duration-200 pointer-events-auto ${
                  playHover ? 'scale-110' : ''
                }`}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(
                    `/play?source=${first.source}&id=${
                      first.id
                    }&title=${encodeURIComponent(first.title)}${
                      year ? `&year=${year}` : ''
                    }&from=aggregate`
                  );
                }}
                onMouseEnter={() => setPlayHover(true)}
                onMouseLeave={() => setPlayHover(false)}
              >
                <PlayCircleSolid fillColor={playHover ? '#22c55e' : 'none'} />
              </div>
            </div>
          </div>

          {mostFrequentDoubanId && (
            <a
              href={`https://movie.douban.com/subject/${mostFrequentDoubanId}`}
              target='_blank'
              rel='noopener noreferrer'
              onClick={(e) => e.stopPropagation()}
              className='absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200'
            >
              <div className='w-4 h-4 sm:w-7 sm:h-7 rounded-full bg-green-500 flex items-center justify-center transition-all duration-200 hover:scale-110'>
                <LinkIcon className='w-4 h-4 text-white' strokeWidth={2} />
              </div>
            </a>
          )}
        </div>

        {/* 标题 */}
        <div className='absolute top-[calc(100%+0.2rem)] left-0 right-0'>
          <div className='flex flex-col items-center justify-center'>
            <span className='text-gray-900 font-semibold truncate w-full text-center text-xs sm:text-sm dark:text-gray-200'>
              {first.title}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AggregateCard;
