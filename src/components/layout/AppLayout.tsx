import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="pl-64 transition-all duration-300">
        <div className="min-h-screen p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
