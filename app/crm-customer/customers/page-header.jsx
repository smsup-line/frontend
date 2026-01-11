'use client';

import { useState } from 'react';
import { Users, Plus, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader as PageHeaderComponent } from '@/components/layouts/crm/components/page-header';
import { NewCustomerSheet } from './new-customer-sheet';
import { ExportCustomerSheet } from './export-customer-sheet';
import { ImportCustomerSheet } from './import-customer-sheet';

export function PageHeader() {
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  return (
    <>
      <PageHeaderComponent
        title="จัดการลูกค้า"
        description="จัดการข้อมูลลูกค้า"
        icon={Users}>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsExportOpen(true)}>
            <Download className="size-4" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="size-4" />
            Import Excel
          </Button>
          <Button onClick={() => setIsNewCustomerOpen(true)}>
            <Plus className="size-4" />
            เพิ่มลูกค้า
          </Button>
        </div>
      </PageHeaderComponent>
      <NewCustomerSheet open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen} />
      <ExportCustomerSheet open={isExportOpen} onOpenChange={setIsExportOpen} />
      <ImportCustomerSheet open={isImportOpen} onOpenChange={setIsImportOpen} />
    </>
  );
}



