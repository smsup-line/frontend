'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
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

export function ImportCustomerSheet({ open, onOpenChange }) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [userRole, setUserRole] = useState(null);
  const [userStoreId, setUserStoreId] = useState(null);
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('all');

  useEffect(() => {
    if (open) {
      loadUserInfo();
      loadStores();
    } else {
      setFile(null);
      setPreview(null);
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast.error('กรุณาเลือกไฟล์ Excel (.xlsx หรือ .xls)');
        return;
      }
      setFile(selectedFile);
      readFilePreview(selectedFile);
    }
  };

  const readFilePreview = async (file) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Show first 5 rows as preview
      const previewData = jsonData.slice(0, 6);
      setPreview(previewData);
    } catch (error) {
      console.error('Failed to read file:', error);
      toast.error('ไม่สามารถอ่านไฟล์ได้');
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('กรุณาเลือกไฟล์');
      return;
    }

    if (selectedStoreId === 'all' && userRole === 'superadmin') {
      toast.error('กรุณาเลือกร้านค้า');
      return;
    }

    try {
      setLoading(true);

      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error('ไฟล์ไม่มีข้อมูล');
        return;
      }

      // Load custom fields
      const shopId = selectedStoreId !== 'all' ? selectedStoreId : userStoreId;
      let customFields = [];
      if (shopId) {
        try {
          const fields = await customFieldsApi.getAll({ shop_id: shopId });
          customFields = Array.isArray(fields) 
            ? fields.filter(f => f.is_importable !== false)
            : [];
        } catch (error) {
          console.error('Failed to load custom fields:', error);
        }
        // Create a map of field name to field object
        customFields = customFields.reduce((acc, field) => {
          acc[field.name] = field;
          return acc;
        }, {});
      }

      const shopIdToUse = selectedStoreId !== 'all' ? selectedStoreId : userStoreId;
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Process each row
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        try {
          // Get ID from Excel (if exists)
          const excelId = row['ID'] || row['id'] || '';
          const hasId = excelId && excelId.toString().trim() !== '';

          // Map Excel columns to customer data
          const customerData = {
            name: row['ชื่อ'] || row['Name'] || '',
            phone: row['เบอร์โทรศัพท์'] || row['Phone'] || '',
            role: row['Role'] === 'Staff ร้าน' || row['Role'] === 'adminshop' ? 'adminshop' : 'customer',
            otp_verify: row['OTP Verify'] === 'ยืนยันแล้ว' || row['OTP Verify'] === true,
            line_token: row['Line Token'] || row['LineToken'] || null,
            shop_id: shopIdToUse,
            branch_id: row['รหัสสาขา'] || row['Branch ID'] || null,
          };

          // Validate required fields
          if (!customerData.name || !customerData.phone) {
            errors.push(`แถว ${i + 2}: ไม่มีชื่อหรือเบอร์โทรศัพท์`);
            errorCount++;
            continue;
          }

          let customerId;

          if (hasId) {
            // If ID exists, try to update
            try {
              // Verify the customer exists with this ID
              const existingCustomer = await customerApi.getById(excelId);
              if (existingCustomer) {
                // Update existing customer
                await customerApi.update(excelId, customerData);
                customerId = excelId;
              } else {
                errors.push(`แถว ${i + 2}: ไม่พบลูกค้าที่มี ID: ${excelId}`);
                errorCount++;
                continue;
              }
            } catch (error) {
              console.error(`Failed to update customer at row ${i + 2}:`, error);
              errors.push(`แถว ${i + 2}: ไม่สามารถอัปเดตลูกค้าได้ - ${error.message || 'ไม่พบข้อมูล'}`);
              errorCount++;
              continue;
            }
          } else {
            // If ID is empty, check for duplicate phone before inserting
            try {
              // Check phone duplicate
              const checkResult = await customerApi.checkPhoneDuplicate(
                customerData.phone,
                shopIdToUse,
                customerData.branch_id
              );

              if (checkResult && checkResult.isDuplicate) {
                errors.push(`แถว ${i + 2}: เบอร์โทรศัพท์ ${customerData.phone} ถูกใช้งานแล้ว`);
                errorCount++;
                continue;
              }

              // Create new customer
              const newCustomer = await customerApi.create(customerData);
              customerId = newCustomer.id || newCustomer.data?.id;

              if (!customerId) {
                errors.push(`แถว ${i + 2}: ไม่สามารถสร้างลูกค้าได้ - ไม่ได้รับ ID`);
                errorCount++;
                continue;
              }
            } catch (error) {
              console.error(`Failed to create customer at row ${i + 2}:`, error);
              // Check if error is due to duplicate phone
              if (error.message && error.message.includes('duplicate') || error.message && error.message.includes('ซ้ำ')) {
                errors.push(`แถว ${i + 2}: เบอร์โทรศัพท์ ${customerData.phone} ถูกใช้งานแล้ว`);
              } else {
                errors.push(`แถว ${i + 2}: ${error.message || 'ไม่สามารถสร้างลูกค้าได้'}`);
              }
              errorCount++;
              continue;
            }
          }

          // Import custom values
          if (customerId && Object.keys(customFields).length > 0) {
            for (const [fieldName, field] of Object.entries(customFields)) {
              const value = row[fieldName];
              if (value !== undefined && value !== null && value !== '') {
                try {
                  await customerCustomValuesApi.createOrUpdate(customerId, {
                    field_id: field.id,
                    value: String(value),
                  });
                } catch (error) {
                  console.error(`Failed to save custom value for field ${fieldName}:`, error);
                }
              }
            }
          }

          successCount++;
        } catch (error) {
          console.error(`Error processing row ${i + 2}:`, error);
          errors.push(`แถว ${i + 2}: ${error.message || 'เกิดข้อผิดพลาด'}`);
          errorCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(`Import สำเร็จ: ${successCount} รายการ`);
      }
      if (errorCount > 0) {
        toast.error(`Import มีข้อผิดพลาด: ${errorCount} รายการ`);
        console.error('Import errors:', errors);
      }

      onOpenChange(false);
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('ไม่สามารถ Import ได้: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:w-[600px] sm:max-w-none inset-5 start-auto h-auto rounded-lg p-0 [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="border-b py-3.5 px-5 border-border">
          <SheetTitle className="flex items-center gap-2.5">
            <FileSpreadsheet className="text-primary size-4" />
            Import ข้อมูลลูกค้า
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

              <div className="space-y-2">
                <label className="text-sm font-medium">เลือกไฟล์ Excel</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full">
                  <Upload className="size-4 mr-2" />
                  {file ? file.name : 'เลือกไฟล์ Excel'}
                </Button>
              </div>

              {preview && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">ตัวอย่างข้อมูล (5 แถวแรก)</label>
                  <div className="border rounded-md overflow-auto max-h-48">
                    <table className="w-full text-xs">
                      <tbody>
                        {preview.map((row, i) => (
                          <tr key={i} className={i === 0 ? 'bg-muted font-semibold' : ''}>
                            {Array.isArray(row) ? (
                              row.map((cell, j) => (
                                <td key={j} className="px-2 py-1 border">
                                  {cell || ''}
                                </td>
                              ))
                            ) : (
                              <td className="px-2 py-1">{JSON.stringify(row)}</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="text-sm text-muted-foreground space-y-1">
                <p>รูปแบบไฟล์ Excel ที่รองรับ:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>คอลัมน์: ชื่อ, เบอร์โทรศัพท์, Role, OTP Verify, Line Token, รหัสร้านค้า, รหัสสาขา</li>
                  <li>Custom Fields จะถูก import ตามชื่อคอลัมน์</li>
                  <li>หากเบอร์โทรศัพท์ซ้ำ จะอัปเดตข้อมูลเดิม</li>
                </ul>
              </div>
            </div>
          </ScrollArea>
        </SheetBody>
        <SheetFooter className="flex items-center justify-between border-t py-3.5 px-5 border-border">
          <div></div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleImport} disabled={loading || !file}>
              <Upload className="size-4 mr-2" />
              {loading ? 'กำลัง Import...' : 'Import Excel'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

