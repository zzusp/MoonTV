import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

interface EpisodeSelectorProps {
  /** 总集数 */
  totalEpisodes: number;
  /** 每页显示多少集，默认 50 */
  episodesPerPage?: number;
  /** 当前选中的集数（1 开始） */
  value?: number;
  /** 用户点击选集后的回调 */
  onChange?: (episodeNumber: number) => void;
  /** 额外 className */
  className?: string;
}

/**
 * 选集组件，支持分页与自动滚动聚焦当前分页标签。
 */
const EpisodeSelector: React.FC<EpisodeSelectorProps> = ({
  totalEpisodes,
  episodesPerPage = 50,
  value = 1,
  onChange,
  className = '',
}) => {
  const pageCount = Math.ceil(totalEpisodes / episodesPerPage);

  // 当前分页索引（0 开始）
  const initialPage = Math.floor((value - 1) / episodesPerPage);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  // 是否倒序显示
  const [descending, setDescending] = useState<boolean>(false);

  // 升序分页标签
  const categoriesAsc = useMemo(() => {
    return Array.from({ length: pageCount }, (_, i) => {
      const start = i * episodesPerPage + 1;
      const end = Math.min(start + episodesPerPage - 1, totalEpisodes);
      return `${start}-${end}`;
    });
  }, [pageCount, episodesPerPage, totalEpisodes]);

  // 分页标签始终保持升序
  const categories = categoriesAsc;

  const categoryContainerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // 当分页切换时，将激活的分页标签滚动到视口中间
  useEffect(() => {
    const btn = buttonRefs.current[currentPage];
    if (btn) {
      btn.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentPage, pageCount]);

  const handleCategoryClick = useCallback((index: number) => {
    setCurrentPage(index);
  }, []);

  const handleEpisodeClick = useCallback(
    (episodeNumber: number) => {
      onChange?.(episodeNumber);
    },
    [onChange]
  );

  const currentStart = currentPage * episodesPerPage + 1;
  const currentEnd = Math.min(
    currentStart + episodesPerPage - 1,
    totalEpisodes
  );

  return (
    <div
      className={`md:ml-6 px-6 py-3 h-full rounded-2xl bg-black/10 dark:bg-white/5 flex flex-col ${className}`.trim()}
    >
      {/* 分类标签 */}
      <div className='flex items-center gap-4 mb-4 border-b border-gray-300 dark:border-gray-700 -mx-6 px-6 flex-shrink-0'>
        <div className='flex-1 overflow-x-auto' ref={categoryContainerRef}>
          <div className='flex gap-2 min-w-max'>
            {categories.map((label, idx) => {
              const isActive = idx === currentPage;
              return (
                <button
                  key={label}
                  ref={(el) => {
                    buttonRefs.current[idx] = el;
                  }}
                  onClick={() => handleCategoryClick(idx)}
                  className={`w-20 relative py-2 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 text-center 
                    ${
                      isActive
                        ? 'text-green-500 dark:text-green-400'
                        : 'text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400'
                    }
                  `.trim()}
                >
                  {label}
                  {isActive && (
                    <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-green-500 dark:bg-green-400' />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {/* 向上/向下按钮占位，可根据实际需求添加功能 */}
        <button
          className='flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-gray-700 hover:text-green-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-green-400 dark:hover:bg-white/20 transition-colors transform translate-y-[-4px]'
          onClick={() => {
            // 切换集数排序（正序/倒序）
            setDescending((prev) => !prev);
          }}
        >
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'
            />
          </svg>
        </button>
      </div>

      {/* 集数网格 */}
      <div className='grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] auto-rows-[40px] gap-x-3 gap-y-3 overflow-y-auto h-full'>
        {(() => {
          const len = currentEnd - currentStart + 1;
          const episodes = Array.from({ length: len }, (_, i) =>
            descending ? currentEnd - i : currentStart + i
          );
          return episodes;
        })().map((episodeNumber) => {
          const isActive = episodeNumber === value;
          return (
            <button
              key={episodeNumber}
              onClick={() => handleEpisodeClick(episodeNumber - 1)}
              className={`h-10 flex items-center justify-center text-sm font-medium rounded-md transition-all duration-200 
                ${
                  isActive
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/25 dark:bg-green-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:scale-105 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20'
                }`.trim()}
            >
              {episodeNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EpisodeSelector;
