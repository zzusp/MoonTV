import { useSidebar } from './Sidebar';
import Sidebar from './Sidebar';

interface PageLayoutProps {
  children: React.ReactNode;
  activePath?: string;
}

const PageLayout = ({ children, activePath = '/' }: PageLayoutProps) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className='grid grid-cols-[auto_1fr] w-full'>
      <Sidebar activePath={activePath} />
      <div
        className={`min-w-0 transition-all duration-300 ${
          isCollapsed ? 'col-start-2' : 'col-start-2'
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
