'use client';

import { ScanLine } from 'lucide-react';
import { PageHeader as PageHeaderComponent } from '@/components/layouts/crm/components/page-header';

export function PageHeader() {
  return (
    <PageHeaderComponent
      title="แสกนใบเสร็จรับเงิน"
      description="แสกนรูปภาพใบเสร็จรับเงินและบันทึกคะแนนสะสม"
      icon={ScanLine}
    />
  );
}




