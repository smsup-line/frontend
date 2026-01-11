'use client';

import { Settings } from 'lucide-react';
import { PageHeader as PageHeaderComponent } from '@/components/layouts/crm/components/page-header';

export function PageHeader() {
  return (
    <PageHeaderComponent
      title="ตั้งค่าระบบร้านค้า"
      description="จัดการตั้งค่าระบบร้านค้า"
      icon={Settings}
    />
  );
}




