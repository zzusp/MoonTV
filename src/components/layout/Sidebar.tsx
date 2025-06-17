import { Film, Folder, Home, Menu, Search, Star, Tv } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// 可替换为你自己的 logo 图片
const Logo = () => (
  <div className='flex items-center justify-center h-16 select-none'>
    <span className='text-2xl font-bold text-green-600 tracking-tight'>
      LibreTV
    </span>
  </div>
);

interface SidebarProps {
  onToggle?: (collapsed: boolean) => void;
}

const Sidebar = ({ onToggle }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [active, setActive] = useState('/');

  const handleToggle = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onToggle?.(newCollapsed);
  };

  const menuItems = [
    { icon: Tv, label: '电视剧', href: '/tv-shows' },
    { icon: Film, label: '电影', href: '/movies' },
    { icon: Star, label: '豆瓣 Top250', href: '/top250' },
    { icon: Folder, label: '合集', href: '/collections' },
    { icon: Star, label: '热门电影', href: '/douban/hot-movies' },
    { icon: Star, label: '热门电视剧', href: '/douban/hot-tv' },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white/40 backdrop-blur-xl transition-all duration-300 border-r border-gray-200/50 z-10 shadow-lg ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className='flex h-full flex-col'>
        {/* 顶部 Logo 区域 */}
        <div className='relative h-16'>
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
              isCollapsed ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <Logo />
          </div>
          <button
            onClick={handleToggle}
            className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 transition-colors duration-200 ${
              isCollapsed ? 'left-1/2 -translate-x-1/2' : 'right-2'
            }`}
          >
            <Menu className='h-4 w-4' />
          </button>
        </div>

        {/* 搜索框 */}
        <div className='px-2 pb-2 h-12'>
          <div
            className={`relative h-full ${
              isCollapsed ? 'w-full max-w-none mx-0' : 'max-w-[215px] mx-auto'
            }`}
          >
            {isCollapsed ? (
              <button className='flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100/50 hover:text-green-600 w-full h-full transition-all duration-300'>
                <Search className='h-4 w-4 text-gray-500' />
              </button>
            ) : (
              <div className='relative h-full'>
                <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 transition-all duration-300' />
                <input
                  type='text'
                  placeholder='搜索...'
                  className='w-full h-full rounded-lg bg-gray-50/80 py-3 pl-9 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white border border-gray-200/50 shadow-sm transition-all duration-300'
                />
              </div>
            )}
          </div>
        </div>

        {/* 首页导航 */}
        <nav className='px-2 mt-4'>
          <Link
            href='/'
            onClick={() => setActive('/')}
            data-active={active === '/'}
            className={`flex items-center rounded-lg px-2 py-2 pl-4 text-gray-700 hover:bg-gray-100/30 hover:text-green-600 data-[active=true]:bg-green-500/20 data-[active=true]:text-green-700 font-medium transition-colors duration-200 min-h-[40px] ${
              isCollapsed ? 'w-full max-w-none mx-0' : 'max-w-[215px] mx-auto'
            } gap-3 justify-start`}
          >
            <div className='w-4 h-4 flex items-center justify-center'>
              <Home className='h-4 w-4 text-gray-500 group-hover:text-green-600 data-[active=true]:text-green-700' />
            </div>
            {!isCollapsed && (
              <span className='whitespace-nowrap transition-opacity duration-200 opacity-100'>
                首页
              </span>
            )}
          </Link>
        </nav>

        {/* 菜单项 */}
        <div className='flex-1 overflow-y-auto px-2 pt-4'>
          <div className='space-y-1'>
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setActive(item.href)}
                data-active={active === item.href}
                className={`group flex items-center rounded-lg px-2 py-2 pl-4 text-gray-700 hover:bg-gray-100/30 hover:text-green-600 data-[active=true]:bg-green-500/20 data-[active=true]:text-green-700 transition-colors duration-200 min-h-[40px] ${
                  isCollapsed
                    ? 'w-full max-w-none mx-0'
                    : 'max-w-[215px] mx-auto'
                } gap-3 justify-start`}
              >
                <div className='w-4 h-4 flex items-center justify-center'>
                  <item.icon className='h-4 w-4 text-gray-500 group-hover:text-green-600 group-data-[active=true]:text-green-700' />
                </div>
                {!isCollapsed && (
                  <span className='whitespace-nowrap transition-opacity duration-200 opacity-100'>
                    {item.label}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
