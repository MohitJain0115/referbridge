
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { FirebaseAnalytics } from '@/components/shared/FirebaseAnalytics';
import { Suspense } from 'react';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'ReferBridge',
  description: 'Connect with employees for job referrals.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased px-6")}>
        <Suspense>
          <FirebaseAnalytics />
        </Suspense>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
