'use client';

import { useState } from 'react';
import { UserPlus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader as PageHeaderComponent } from '@/components/layouts/crm/components/page-header';
import { NewReferrerSheet } from './new-referrer-sheet';

export function PageHeader({ onRefresh }) {
  const [isNewReferrerOpen, setIsNewReferrerOpen] = useState(false);

  return (
    <>
      <PageHeaderComponent
        title="แนะนำเพื่อน"
        description="จัดการข้อมูลผู้แนะนำ"
        icon={UserPlus}>
        <Button onClick={() => setIsNewReferrerOpen(true)}>
          <Plus className="size-4" />
          เพิ่มผู้แนะนำ
        </Button>
      </PageHeaderComponent>
      <NewReferrerSheet
        open={isNewReferrerOpen}
        onOpenChange={setIsNewReferrerOpen}
        onSuccess={() => {
          if (onRefresh) {
            onRefresh();
          }
        }}
      />
    </>
  );
}




