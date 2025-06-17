import { useSidebar } from './Sidebar';
import Sidebar from './Sidebar';

interface PageLayoutProps {
  children: React.ReactNode;
  activePath?: string;
}

const PageLayout = ({ children, activePath = '/' }: PageLayoutProps) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className='grid grid-cols-[auto_1fr] min-h-screen'>
      <Sidebar activePath={activePath} />
      <div
        className={`transition-all duration-300 ${
          isCollapsed ? 'col-start-2' : 'col-start-2'
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
