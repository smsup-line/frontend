'use client';

import { Suspense } from 'react';

// Layout สำหรับหน้า login ที่ไม่ใช้ sidebar และ header bar
// useSearchParams ในหน้า login ต้องอยู่ใต้ Suspense (Next.js)
export default function LoginLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center text-muted-foreground">
            กำลังโหลด...
          </div>
        }
      >
        {children}
      </Suspense>
    </div>
  );
}

