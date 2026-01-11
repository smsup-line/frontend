'use client';

import { useState } from 'react';
import { History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader as PageHeaderComponent } from '@/components/layouts/crm/components/page-header';
import { NewPromotionHistorySheet } from './new-promotion-history-sheet';
import { useSearchParams } from 'next/navigation';

export function PageHeader({ onRefresh }) {
  const [isNewOpen, setIsNewOpen] = useState(false);
  const searchParams = useSearchParams();
  const promotionId = searchParams?.get('promotion_id');

  return (
    <>
      <PageHeaderComponent
        title="ประวัติการใช้โปรโมชั่น"
        description="จัดการประวัติการใช้โปรโมชั่น"
        icon={History}>
        <Button onClick={() => setIsNewOpen(true)}>
          <Plus className="size-4" />
          เพิ่มประวัติการใช้โปรโมชั่น
        </Button>
      </PageHeaderComponent>
      <NewPromotionHistorySheet 
        open={isNewOpen} 
        onOpenChange={setIsNewOpen}
        promotionId={promotionId}
        onSuccess={onRefresh}
      />
    </>
  );
}

