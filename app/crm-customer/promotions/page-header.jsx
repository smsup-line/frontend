'use client';

import { useState } from 'react';
import { Gift, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader as PageHeaderComponent } from '@/components/layouts/crm/components/page-header';
import { NewPromotionSheet } from './new-promotion-sheet';

export function PageHeader({ onRefresh }) {
  const [isNewOpen, setIsNewOpen] = useState(false);

  return (
    <>
      <PageHeaderComponent
        title="โปรโมชั่น"
        description="จัดการโปรโมชั่น"
        icon={Gift}>
        <Button onClick={() => setIsNewOpen(true)}>
          <Plus className="size-4" />
          เพิ่มโปรโมชั่น
        </Button>
      </PageHeaderComponent>
      <NewPromotionSheet 
        open={isNewOpen} 
        onOpenChange={setIsNewOpen}
        onSuccess={onRefresh}
      />
    </>
  );
}
