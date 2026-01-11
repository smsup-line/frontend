'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Content } from '@/components/layouts/crm/components/content';
import MenusList from './menus-list';
import { PageHeader } from './page-header';
import { ScreenLoader } from '@/components/screen-loader';

export default function MenusPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isChecking, setIsChecking] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const role = user.role || user.level;
          setUserRole(role);
          
          // ตรวจสอบว่าเป็น superadmin หรือไม่
          if (role !== 'superadmin') {
            router.replace('/crm-customer/dashboard');
            return;
          }
        } catch (e) {
          console.error('Failed to parse user info:', e);
          router.replace('/crm-customer/dashboard');
          return;
        }
      } else {
        router.replace('/crm-customer/login');
        return;
      }
    }
    setIsChecking(false);
  }, [router]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (isChecking) {
    return <ScreenLoader />;
  }

  if (userRole !== 'superadmin') {
    return null;
  }

  return (
    <>
      <PageHeader onRefresh={handleRefresh} />
      <Content className="block py-0">
        <MenusList refreshKey={refreshKey} />
      </Content>
    </>
  );
}

