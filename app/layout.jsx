import { Suspense } from 'react';

import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: {
    template: '%s | Metronic',
    default: 'Metronic' // a default is required when creating a template
  }
};

export default async function RootLayout({
  children


}) {
  return (
    <html className="h-full" suppressHydrationWarning>
      <head>
        <script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
      </head>
      <body
        className={cn(
          'antialiased flex h-full w-full min-w-0 flex-col text-base text-foreground bg-background',
          inter.className
        )}>

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          storageKey="nextjs-theme"
          enableSystem
          disableTransitionOnChange
          enableColorScheme>

          <TooltipProvider delayDuration={0}>
            <Suspense>
              <div className="flex w-full min-w-0 flex-1 flex-col">{children}</div>
            </Suspense>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>);

}