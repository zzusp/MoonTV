import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface CollectionCardProps {
  title: string;
  icon: LucideIcon;
  href: string;
}

export default function CollectionCard({
  title,
  icon: Icon,
  href,
}: CollectionCardProps) {
  return (
    <Link href={href} className='group block'>
      <div className='relative w-full'>
        {/* 长方形容器 - 调整宽高比和背景色 */}
        <div className='relative aspect-[5/3] w-full overflow-hidden rounded-xl bg-gray-200 border border-gray-300/50'>
          {/* 图标容器 */}
          <div className='absolute inset-0 flex items-center justify-center'>
            <Icon className='h-8 w-8 sm:h-12 sm:w-12 text-gray-600' />
          </div>

          {/* Hover 蒙版效果 - 参考 DemoCard */}
          <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200'></div>
        </div>

        {/* 标题 - absolute 定位，类似 DemoCard */}
        <div className='absolute top-[calc(100%+0.5rem)] left-0 right-0'>
          <div className='flex flex-col items-center justify-center'>
            <h3 className='text-xs sm:text-sm font-medium text-gray-800 truncate w-full text-center'>
              {title}
            </h3>
          </div>
        </div>
      </div>
    </Link>
  );
}
