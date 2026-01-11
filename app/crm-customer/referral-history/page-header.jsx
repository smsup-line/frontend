'use client';

import { useState } from 'react';
import { History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader as PageHeaderComponent } from '@/components/layouts/crm/components/page-header';
import { NewReferralHistorySheet } from './new-referral-history-sheet';

export function PageHeader({ onRefresh, referrerId }) {
  const [isNewHistoryOpen, setIsNewHistoryOpen] = useState(false);

  return (
    <>
      <PageHeaderComponent
        title="ประวัติการแนะนำ"
        description={referrerId ? "ประวัติการแนะนำของลูกค้า" : "ประวัติการแนะนำทั้งหมด"}
        icon={History}>
        <Button onClick={() => setIsNewHistoryOpen(true)}>
          <Plus className="size-4" />
          เพิ่มประวัติการแนะนำ
        </Button>
      </PageHeaderComponent>
      <NewReferralHistorySheet
        open={isNewHistoryOpen}
        onOpenChange={setIsNewHistoryOpen}
        referrerId={referrerId}
        onSuccess={() => {
          if (onRefresh) {
            onRefresh();
          }
        }}
      />
    </>
  );
}




