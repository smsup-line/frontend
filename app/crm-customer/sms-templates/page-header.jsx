'use client';

import { useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader as PageHeaderComponent } from '@/components/layouts/crm/components/page-header';
import { NewSmsTemplateSheet } from './new-sms-template-sheet';

export function PageHeader() {
  const [isNewOpen, setIsNewOpen] = useState(false);

  return (
    <>
      <PageHeaderComponent
        title="SMS Template"
        description="จัดการ SMS Template"
        icon={MessageSquare}>
        <Button onClick={() => setIsNewOpen(true)}>
          <Plus className="size-4" />
          เพิ่ม SMS Template
        </Button>
      </PageHeaderComponent>
      <NewSmsTemplateSheet open={isNewOpen} onOpenChange={setIsNewOpen} />
    </>
  );
}




