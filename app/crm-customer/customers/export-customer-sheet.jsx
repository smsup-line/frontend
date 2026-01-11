'use client';

import { useState, useEffect } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { customerApi, customFieldsApi, customerCustomValuesApi, storeApi } from '@/lib/api';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export function ExportCustomerSheet({ open, onOpenChange }) {
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userStoreId, setUserStoreId] = useState(null);
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('all');

  useEffect(() => {
    if (open) {
      loadUserInfo();
      loadStores();
    }
  }, [open]);

  const loadUserInfo = () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserRole(user.role);
          setUserStoreId(user.shop_id || user.storeId);
          if (user.role !== 'superadmin') {
            setSelectedStoreId(user.shop_id || user.storeId || 'all');
          }
        } catch (e) {
          console.error('Failed to parse user info:', e);
        }
      }
    }
  };

  const loadStores = async () => {
    try {
      const data = await storeApi.getAll();
      setStores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load stores:', error);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      // Load customers
      const params = selectedStoreId !== 'all' ? { shop_id: selectedStoreId } : {};
      const customers = await customerApi.getAll(params);
      const customersArray = Array.isArray(customers) ? customers : [];

      if (customersArray.length === 0) {
        toast.error('ไม่พบข้อมูลลูกค้า');
        return;
      }

      // Load custom fields for the store
      const shopId = selectedStoreId !== 'all' ? selectedStoreId : userStoreId;
      let customFields = [];
      if (shopId) {
        try {
          const fields = await customFieldsApi.getAll({ shop_id: shopId });
          customFields = Array.isArray(fields) 
            ? fields.filter(f => f.is_exportable !== false)
            : [];
          customFields.sort((a, b) => (a.field_order || 0) - (b.field_order || 0));
        } catch (error) {
          console.error('Failed to load custom fields:', error);
        }
      }

      // Load custom values for each customer
      const customersWithCustomValues = await Promise.all(
        customersArray.map(async (customer) => {
          try {
            const customValues = await customerCustomValuesApi.getAll(customer.id);
            const valuesMap = {};
            if (Array.isArray(customValues)) {
              customValues.forEach(item => {
                valuesMap[item.field_id] = item.value;
              });
            }
            return {
              ...customer,
              customValues: valuesMap,
            };
          } catch (error) {
            console.error(`Failed to load custom values for customer ${customer.id}:`, error);
            return {
              ...customer,
              customValues: {},
            };
          }
        })
      );

      // Prepare data for Excel
      const excelData = customersWithCustomValues.map((customer) => {
        const row = {
          'ID': customer.id || '',
          'ชื่อ': customer.name || '',
          'เบอร์โทรศัพท์': customer.phone || '',
          'Role': customer.role === 'adminshop' ? 'Staff ร้าน' : 'ลูกค้าร้าน',
          'OTP Verify': customer.otp_verify ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน',
          'Line Token': customer.line_token || '',
          'รหัสร้านค้า': customer.shop_id || '',
          'รหัสสาขา': customer.branch_id || '',
          'คะแนนสะสม': customer.total_points || 0,
          'เวลาเช็คอินล่าสุด': customer.last_checkin_at 
            ? new Date(customer.last_checkin_at).toLocaleString('th-TH')
            : '',
        };

        // Add custom fields
        customFields.forEach((field) => {
          const value = customer.customValues[field.id] || '';
          row[field.name] = value;
        });

        return row;
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 36 }, // ID
        { wch: 20 }, // ชื่อ
        { wch: 15 }, // เบอร์โทรศัพท์
        { wch: 15 }, // Role
        { wch: 15 }, // OTP Verify
        { wch: 30 }, // Line Token
        { wch: 15 }, // รหัสร้านค้า
        { wch: 15 }, // รหัสสาขา
        { wch: 12 }, // คะแนนสะสม
        { wch: 20 }, // เวลาเช็คอินล่าสุด
      ];
      // Add widths for custom fields
      customFields.forEach(() => colWidths.push({ wch: 20 }));
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'ลูกค้า');

      // Generate filename
      const storeName = selectedStoreId !== 'all' 
        ? stores.find(s => s.id === selectedStoreId)?.name || 'all'
        : 'all';
      const filename = `customers_${storeName}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      toast.success(`Export สำเร็จ: ${customersArray.length} รายการ`);
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('ไม่สามารถ Export ได้: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:w-[500px] sm:max-w-none inset-5 start-auto h-auto rounded-lg p-0 [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="border-b py-3.5 px-5 border-border">
          <SheetTitle className="flex items-center gap-2.5">
            <FileSpreadsheet className="text-primary size-4" />
            Export ข้อมูลลูกค้า
          </SheetTitle>
        </SheetHeader>
        <SheetBody className="p-0">
          <ScrollArea className="h-[calc(100dvh-11.75rem)] ps-3 pe-2 me-1">
            <div className="space-y-6 px-2 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">เลือกร้านค้า</label>
                {userRole === 'superadmin' ? (
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}>
                    <option value="all">ทั้งหมด</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md bg-muted"
                    value={stores.find(s => s.id === userStoreId)?.name || ''}
                    disabled
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                ข้อมูลที่ Export จะรวม Custom Fields ที่สร้างไว้ด้วย
              </p>
            </div>
          </ScrollArea>
        </SheetBody>
        <SheetFooter className="flex items-center justify-between border-t py-3.5 px-5 border-border">
          <div></div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleExport} disabled={loading}>
              <Download className="size-4 mr-2" />
              {loading ? 'กำลัง Export...' : 'Export Excel'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}


