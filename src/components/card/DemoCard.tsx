import { Search } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

interface DemoCardProps {
  title: string;
  poster: string;
  rating?: number;
  type: 'movie' | 'tv';
  episodes?: number;
}

function SearchCircle({
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
      style={{ display: 'block' }}
    >
      <circle
        cx='22'
        cy='22'
        r='20'
        stroke='white'
        strokeWidth='1.5'
        fill={fillColor}
      />
      <g>
        <foreignObject x='12' y='12' width='20' height='20'>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            <Search className='h-7 w-7 text-white' strokeWidth={2} />
          </div>
        </foreignObject>
      </g>
    </svg>
  );
}

const DemoCard = ({ title, poster, episodes }: DemoCardProps) => {
  const [hover, setHover] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    router.push(`/search?q=${encodeURIComponent(title)}`);
  };

  return (
    <div
      className='group relative w-full overflow-hidden rounded-lg bg-white border border-[#e6e6e6] shadow-none flex flex-col cursor-pointer'
      onClick={handleClick}
    >
      {/* 海报图片 - 2:3 比例 */}
      <div className='relative aspect-[2/3] w-full overflow-hidden'>
        <Image src={poster} alt={title} fill className='object-cover' />
        {/* Hover 效果 */}
        <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center group'>
          <div className='absolute inset-0 flex items-center justify-center'>
            <div
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              className={`transition-all duration-200 ${
                hover ? 'scale-110' : ''
              }`}
            >
              <SearchCircle fillColor={hover ? '#22c55e' : 'none'} />
            </div>
          </div>
        </div>
        {/* 集数指示器 - 绿色小圆球 */}
        {episodes && (
          <div className='absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center'>
            <span className='text-white text-xs font-bold'>{episodes}</span>
          </div>
        )}
      </div>
      {/* 信息层 */}
      <div className='p-2'>
        <div className='flex items-center justify-between'>
          <span className='text-gray-900 font-semibold truncate flex-1 mr-2'>
            {title}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DemoCard;
