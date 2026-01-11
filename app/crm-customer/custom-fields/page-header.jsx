'use client';

import { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader as PageHeaderComponent } from '@/components/layouts/crm/components/page-header';
import { NewCustomFieldSheet } from './new-custom-field-sheet';

export function PageHeader() {
  const [isNewOpen, setIsNewOpen] = useState(false);

  return (
    <>
      <PageHeaderComponent
        title="Custom Fields"
        description="จัดการ Custom Fields"
        icon={FileText}>
        <Button onClick={() => setIsNewOpen(true)}>
          <Plus className="size-4" />
          เพิ่ม Custom Field
        </Button>
      </PageHeaderComponent>
      <NewCustomFieldSheet open={isNewOpen} onOpenChange={setIsNewOpen} />
    </>
  );
}




