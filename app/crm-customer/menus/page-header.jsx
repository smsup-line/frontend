'use client';

import { useState } from 'react';
import { Menu, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader as PageHeaderComponent } from '@/components/layouts/crm/components/page-header';
import { NewMenuSheet } from './new-menu-sheet';

export function PageHeader({ onRefresh }) {
  const [isNewOpen, setIsNewOpen] = useState(false);

  return (
    <>
      <PageHeaderComponent
        title="จัดการเมนู"
        description="จัดการเมนูระบบ"
        icon={Menu}>
        <Button onClick={() => setIsNewOpen(true)}>
          <Plus className="size-4" />
          เพิ่มเมนู
        </Button>
      </PageHeaderComponent>
      <NewMenuSheet 
        open={isNewOpen} 
        onOpenChange={setIsNewOpen}
        onSuccess={onRefresh}
      />
    </>
  );
}

