'use client';

import { useState } from 'react';
import { Coins, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader as PageHeaderComponent } from '@/components/layouts/crm/components/page-header';
import { NewPointsSheet } from './new-points-sheet';

export function PageHeader({ onRefresh }) {
  const [isNewPointsOpen, setIsNewPointsOpen] = useState(false);

  return (
    <>
      <PageHeaderComponent
        title="ประวัติคะแนนสะสมลูกค้า"
        description="ดูประวัติคะแนนสะสมของลูกค้า"
        icon={Coins}>
        <Button onClick={() => setIsNewPointsOpen(true)}>
          <Plus className="size-4" />
          เพิ่มคะแนนสะสม
        </Button>
      </PageHeaderComponent>
      <NewPointsSheet
        open={isNewPointsOpen}
        onOpenChange={setIsNewPointsOpen}
        onSuccess={() => {
          if (onRefresh) {
            onRefresh();
          }
        }}
      />
    </>
  );
}

