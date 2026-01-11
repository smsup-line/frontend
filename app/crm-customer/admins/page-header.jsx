'use client';

import { useState } from 'react';
import { UserCog, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader as PageHeaderComponent } from '@/components/layouts/crm/components/page-header';
import { NewAdminSheet } from './new-admin-sheet';

export function PageHeader() {
  const [isNewAdminOpen, setIsNewAdminOpen] = useState(false);

  return (
    <>
      <PageHeaderComponent
        title="จัดการผู้ดูแลระบบ"
        description="จัดการข้อมูลผู้ดูแลระบบ"
        icon={UserCog}>
        <Button onClick={() => setIsNewAdminOpen(true)}>
          <Plus className="size-4" />
          เพิ่มผู้ดูแลระบบ
        </Button>
      </PageHeaderComponent>
      <NewAdminSheet open={isNewAdminOpen} onOpenChange={setIsNewAdminOpen} />
    </>
  );
}




