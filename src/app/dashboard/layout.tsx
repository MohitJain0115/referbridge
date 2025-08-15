
'use client';

import { Navbar } from '@/components/shared/Navbar';
import { DashboardNav } from '@/components/dashboard/DashboardNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />
      <div className="flex flex-1">
        <aside className="hidden md:block w-64 border-r bg-background p-4">
          <DashboardNav />
        </aside>
        <main className="flex-1 bg-muted/40 p-4 md:p-10">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
