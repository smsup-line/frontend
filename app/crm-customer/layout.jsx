'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { DefaultLayout } from '@/components/layouts/crm';
import { LayoutProvider } from '@/components/layouts/crm/components/layout-context';
import { ScreenLoader } from '@/components/screen-loader';
import { CRM_CUSTOMER_NAV } from '@/app/crm-customer/config/app.config';
import { AuthGuard } from './components/auth-guard';

// ฟังก์ชันกรอง menu ตาม role
function getFilteredNavItems(userRole) {
  // ถ้ายังไม่มี role ให้แสดงทุก menu (จะกรองอีกทีเมื่อมี role)
  if (!userRole) {
    return CRM_CUSTOMER_NAV;
  }
  
  // Normalize role: convert to lowercase และ trim
  const normalizedRole = String(userRole).toLowerCase().trim();
  console.log('getFilteredNavItems - userRole:', userRole, 'normalized:', normalizedRole);
  
  return CRM_CUSTOMER_NAV.filter((item) => {
    // ถ้ามี requiredRole ให้ตรวจสอบ
    if (item.requiredRole) {
      const normalizedRequiredRole = String(item.requiredRole).toLowerCase().trim();
      const matches = normalizedRole === normalizedRequiredRole;
      console.log(`  Menu "${item.title}": requiredRole=${normalizedRequiredRole}, userRole=${normalizedRole}, matches=${matches}`);
      return matches;
    }
    // ซ่อนเมนูโปรโมชั่นสำหรับพนักงาน (แสดงเฉพาะ customer และ superadmin)
    if (item.id === 'promotions' && normalizedRole === 'employee') {
      console.log(`  Menu "${item.title}": hiding for employee`);
      return false;
    }
    // ถ้าไม่มี requiredRole แสดงทุกคน
    return true;
  });
}

export default function CrmCustomerLayout({ children }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [navItems, setNavItems] = useState(CRM_CUSTOMER_NAV);

  useEffect(() => {
    // โหลด user role จาก localStorage
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          console.log('Loaded user from localStorage:', user);
          console.log('User role:', user.role);
          
          const role = user.role;
          setUserRole(role);
          const filtered = getFilteredNavItems(role);
          console.log('Filtered nav items:', filtered);
          setNavItems(filtered);
        } catch (e) {
          console.error('Failed to parse user info:', e);
        }
      } else {
        console.warn('No user data in localStorage');
      }
    }

    // Simulate short loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // ถ้าเป็นหน้า login, profile, verify-phone, add-customer, receipt-scanner, receipt-scanner/employee, points-history, my-promotions, หรือ approve-promotions ไม่ต้องใช้ DefaultLayout
  if (pathname === '/crm-customer/login' || 
      pathname === '/crm-customer/profile' || 
      pathname === '/crm-customer/verify-phone' ||
      pathname === '/crm-customer/add-customer' ||
      pathname === '/crm-customer/receipt-scanner' ||
      pathname === '/crm-customer/receipt-scanner/employee' ||
      pathname === '/crm-customer/points-history' ||
      pathname === '/crm-customer/my-promotions' ||
      pathname === '/crm-customer/approve-promotions') {
    return <AuthGuard>{children}</AuthGuard>;
  }

  if (isLoading) {
    return <ScreenLoader />;
  }

  return (
    <AuthGuard>
      <LayoutProvider sidebarNavItems={navItems}>
        <DefaultLayout>{children}</DefaultLayout>
      </LayoutProvider>
    </AuthGuard>
  );
}
