'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ScreenLoader } from '@/components/screen-loader';

export function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      // ตรวจสอบว่ามี token หรือไม่
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('user');

      // ถ้าไม่มี token หรือ user ให้ redirect ไปหน้า login
      if (!token || !userStr) {
        setIsAuthenticated(false);
        setIsChecking(false);
        if (pathname !== '/crm-customer/login') {
          router.replace('/crm-customer/login');
        }
        return;
      }

      // ตรวจสอบว่า user data ถูกต้อง
      try {
        const user = JSON.parse(userStr);
        if (!user || (!user.id && !user.username)) {
          // ถ้า user data ไม่ถูกต้อง ให้ clear และ redirect
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setIsChecking(false);
          if (pathname !== '/crm-customer/login') {
            router.replace('/crm-customer/login');
          }
          return;
        }

        // ตรวจสอบ otp_verify สำหรับลูกค้า (ไม่ใช่ employee)
        const userRole = user.role || user.user_type || 'customer';
        const isEmployee = userRole === 'employee';
        const isCustomer = !isEmployee;
        const otpVerified = user.otp_verify || false;
        
        // ถ้าเป็นลูกค้าและยังไม่ verify OTP และไม่ใช่หน้า verify-phone หรือ login
        if (isCustomer && !otpVerified && pathname !== '/crm-customer/verify-phone' && pathname !== '/crm-customer/login') {
          console.log('Customer OTP not verified, redirecting to verify-phone');
          setIsAuthenticated(false);
          setIsChecking(false);
          router.replace('/crm-customer/verify-phone');
          return;
        }

        // ถ้าทุกอย่างถูกต้อง
        setIsAuthenticated(true);
        setIsChecking(false);

        // ถ้า authenticated และเป็นหน้า login ให้ redirect
        if (pathname === '/crm-customer/login') {
          // ตรวจสอบ otp_verify อีกครั้งก่อน redirect
          if (isCustomer && !otpVerified) {
            router.replace('/crm-customer/verify-phone');
          } else {
            router.replace('/crm-customer/profile');
          }
        }
      } catch (e) {
        // ถ้า parse user ไม่ได้ ให้ clear และ redirect
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setIsChecking(false);
        if (pathname !== '/crm-customer/login') {
          router.replace('/crm-customer/login');
        }
        return;
      }
    };

    checkAuth();
  }, [router, pathname]);

  // ถ้ากำลังตรวจสอบ ให้แสดง loading
  if (isChecking) {
    return <ScreenLoader />;
  }

  // ถ้า authenticated และเป็นหน้า login ให้แสดง loading (กำลัง redirect)
  if (isAuthenticated && pathname === '/crm-customer/login') {
    return <ScreenLoader />;
  }

  // ถ้าไม่ authenticated และไม่ใช่หน้า login ให้แสดง loading (กำลัง redirect)
  if (!isAuthenticated && pathname !== '/crm-customer/login') {
    return <ScreenLoader />;
  }

  // ถ้า authenticated หรือเป็นหน้า login ให้แสดง children
  return children;
}

