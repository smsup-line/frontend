'use client';

// Layout สำหรับหน้า login ที่ไม่ใช้ sidebar และ header bar
// Layout นี้จะ override parent layout (crm-customer/layout.jsx)
// หน้า login จะไม่มี sidebar และ header bar
export default function LoginLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}

