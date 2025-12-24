import { ReactNode } from 'react';
import BottomNavigation from './BottomNavigation';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-gray-50 safe-area-top safe-area-bottom">
      <main className="flex-1 overflow-y-auto pb-16">
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
}

