'use client';

import { useState } from 'react';
import { GitBranch, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader as PageHeaderComponent } from '@/components/layouts/crm/components/page-header';
import { NewBranchSheet } from './new-branch-sheet';

export function PageHeader() {
  const [isNewBranchOpen, setIsNewBranchOpen] = useState(false);

  return (
    <>
      <PageHeaderComponent
        title="จัดการสาขา"
        description="จัดการข้อมูลสาขา"
        icon={GitBranch}>
        <Button onClick={() => setIsNewBranchOpen(true)}>
          <Plus className="size-4" />
          เพิ่มสาขา
        </Button>
      </PageHeaderComponent>
      <NewBranchSheet open={isNewBranchOpen} onOpenChange={setIsNewBranchOpen} />
    </>
  );
}




