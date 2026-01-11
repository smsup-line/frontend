'use client';

import { useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader as PageHeaderComponent } from '@/components/layouts/crm/components/page-header';
import { NewPackageSheet } from './new-package-sheet';

export function PageHeader({ onRefresh }) {
  const [isNewOpen, setIsNewOpen] = useState(false);

  return (
    <>
      <PageHeaderComponent
        title="จัดการแพ็คเกจ"
        description="จัดการแพ็คเกจระบบ"
        icon={Package}>
        <Button onClick={() => setIsNewOpen(true)}>
          <Plus className="size-4" />
          เพิ่มแพ็คเกจ
        </Button>
      </PageHeaderComponent>
      <NewPackageSheet 
        open={isNewOpen} 
        onOpenChange={setIsNewOpen}
        onSuccess={onRefresh}
      />
    </>
  );
}

