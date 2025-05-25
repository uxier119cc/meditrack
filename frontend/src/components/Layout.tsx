
import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { Toaster } from '@/components/ui/toaster';

interface LayoutProps {
  children: React.ReactNode;
  doctorName: string;
  initials: string;
}

const Layout: React.FC<LayoutProps> = ({ children, doctorName, initials }) => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar doctorName={doctorName} initials={initials} />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
      
      <Toaster />
    </div>
  );
};

export default Layout;
