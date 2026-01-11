'use client';

import { useState } from 'react';
import { Store, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader as PageHeaderComponent } from '@/components/layouts/crm/components/page-header';
import { NewStoreSheet } from './new-store-sheet';

export function PageHeader() {
  const [isNewStoreOpen, setIsNewStoreOpen] = useState(false);

  return (
    <>
      <PageHeaderComponent
        title="จัดการร้านค้า"
        description="จัดการข้อมูลร้านค้า"
        icon={Store}>
        <Button onClick={() => setIsNewStoreOpen(true)}>
          <Plus className="size-4" />
          เพิ่มร้านค้า
        </Button>
      </PageHeaderComponent>
      <NewStoreSheet open={isNewStoreOpen} onOpenChange={setIsNewStoreOpen} />
    </>
  );
}




