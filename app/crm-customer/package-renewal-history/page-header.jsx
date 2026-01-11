'use client';

import { useState } from 'react';
import { History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader as PageHeaderComponent } from '@/components/layouts/crm/components/page-header';
import { NewPackageRenewalHistorySheet } from './new-package-renewal-history-sheet';

export function PageHeader({ onRefresh }) {
  const [isNewOpen, setIsNewOpen] = useState(false);

  return (
    <>
      <PageHeaderComponent
        title="ประวัติการต่ออายุแพ็คเกจ"
        description="จัดการประวัติการต่ออายุแพ็คเกจ"
        icon={History}>
        <Button onClick={() => setIsNewOpen(true)}>
          <Plus className="size-4" />
          เพิ่มประวัติการต่ออายุ
        </Button>
      </PageHeaderComponent>
      <NewPackageRenewalHistorySheet 
        open={isNewOpen} 
        onOpenChange={setIsNewOpen}
        onSuccess={onRefresh}
      />
    </>
  );
}


