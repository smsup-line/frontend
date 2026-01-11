'use client';

import { LayoutDashboard } from 'lucide-react';
import { PageHeader as PageHeaderComponent } from '@/components/layouts/crm/components/page-header';

export function PageHeader() {
  return (
    <PageHeaderComponent
      title="หน้าหลัก"
      description="Dashboard"
      icon={LayoutDashboard}
    />
  );
}




