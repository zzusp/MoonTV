import { Heart } from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';

interface VideoCardProps {
  title: string;
  poster: string;
  rating?: number;
  type: 'movie' | 'tv';
  episodes?: number;
  source?: string;
  showProgress?: boolean;
  progress?: number; // 0-100
}

function CheckCircleCustom() {
  return (
    <span className='inline-flex items-center justify-center'>
      <svg
        width='24'
        height='24'
        viewBox='0 0 32 32'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <circle cx='16' cy='16' r='13' stroke='white' strokeWidth='2' />
        <path
          d='M11 16.5L15 20L21 13.5'
          stroke='white'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    </span>
  );
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

const VideoCard = ({
  title,
  poster,
  episodes,
  source,
  showProgress,
  progress,
}: VideoCardProps) => {
  const [playHover, setPlayHover] = useState(false);

  return (
    <div className='group relative w-full overflow-hidden rounded-lg bg-white border border-[#e6e6e6] shadow-none flex flex-col'>
      {/* 海报图片 - 2:3 比例 */}
      <div className='relative aspect-[2/3] w-full overflow-hidden'>
        <Image src={poster} alt={title} fill className='object-cover' />

        {/* Hover 效果 */}
        <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center group'>
          <div className='absolute inset-0 flex items-center justify-center'>
            <div
              onMouseEnter={() => setPlayHover(true)}
              onMouseLeave={() => setPlayHover(false)}
              className={`transition-all duration-200 ${
                playHover ? 'scale-110' : ''
              }`}
              style={{ cursor: 'pointer' }}
            >
              <PlayCircleSolid fillColor={playHover ? '#22c55e' : 'none'} />
            </div>
          </div>
          <div className='absolute bottom-4 right-4 flex items-center gap-6'>
            <CheckCircleCustom />
            <Heart className='h-5 w-5 text-white/90 stroke-[2]' />
          </div>
        </div>

        {/* 集数指示器 - 绿色小圆球 */}
        {episodes && (
          <div className='absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center'>
            <span className='text-white text-xs font-bold'>{episodes}</span>
          </div>
        )}

        {/* 播放进度条 */}
        {showProgress && progress !== undefined && (
          <div className='absolute bottom-0 left-0 right-0 h-1 bg-gray-300'>
            <div
              className='h-full bg-blue-500 transition-all duration-300'
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* 信息层 */}
      <div className='p-2'>
        <div className='flex items-center justify-between'>
          <span className='text-gray-900 font-semibold truncate flex-1 mr-2'>
            {title}
          </span>
          {/* 数据源信息 */}
          {source && (
            <span className='text-gray-400 text-xs flex-shrink-0'>
              {source}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
