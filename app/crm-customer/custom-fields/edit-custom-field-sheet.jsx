'use client';

import { useState, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill } from '@remixicon/react';
import { FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button, ButtonArrow } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandCheck,
} from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { customFieldsApi, storeApi } from '@/lib/api';

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'select', label: 'Select' },
  { value: 'multi_select', label: 'Multi Select' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
];

const createFormSchema = (userRole, userStoreId) => z.object({
  shop_id: z.string().optional().superRefine((val, ctx) => {
    // For admin with userStoreId, always pass (will be auto-filled)
    if (userRole !== 'superadmin' && userStoreId) {
      return; // Pass validation
    }
    // For superadmin or admin without userStoreId, require shop_id
    if (!val || val.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'กรุณาเลือกร้านค้า',
      });
    }
  }),
  name: z.string().min(1, 'กรุณากรอกชื่อฟิลด์'),
  field_key: z.string()
    .min(1, 'กรุณากรอก Field Key')
    .regex(/^[a-zA-Z0-9_]+$/, 'Field Key ต้องไม่มีช่องว่าง และใช้ได้เฉพาะตัวอักษร ตัวเลข และ underscore'),
  description: z.string().optional(),
  field_type: z.enum(['text', 'number', 'date', 'boolean', 'select', 'multi_select', 'email', 'phone'], {
    required_error: 'กรุณาเลือกประเภทฟิลด์',
  }),
  is_required: z.boolean().default(false),
  field_order: z.number().int().min(0).default(0),
  is_exportable: z.boolean().default(true),
  is_importable: z.boolean().default(true),
  is_visible: z.boolean().default(true),
  is_enabled: z.boolean().default(true),
});

export function EditCustomFieldSheet({ open, onOpenChange, customField, stores: storesProp, onSuccess }) {
  const [stores, setStores] = useState(storesProp || []);
  const [storeOpen, setStoreOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userStoreId, setUserStoreId] = useState(null);

  useEffect(() => {
    if (open) {
      loadUserInfo();
      if (!storesProp || storesProp.length === 0) {
        loadStores();
      }
    }
  }, [open, storesProp]);

  // Load user info immediately on mount
  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserRole(user.role);
          setUserStoreId(user.shop_id || user.storeId);
        } catch (e) {
          console.error('Failed to parse user info:', e);
        }
      }
    }
  };

  const loadStores = async () => {
    try {
      const data = await storeApi.getAll();
      const storesList = Array.isArray(data) ? data : [];
      setStores(storesList);
      console.log('Loaded stores:', storesList.length, storesList);
    } catch (error) {
      console.error('Failed to load stores:', error);
      setStores([]);
    }
  };

  // Create resolver with current userRole and userStoreId
  const resolver = useMemo(
    () => zodResolver(createFormSchema(userRole, userStoreId)),
    [userRole, userStoreId]
  );

  const form = useForm({
    resolver,
    defaultValues: {
      shop_id: userStoreId || '',
      name: '',
      field_key: '',
      description: '',
      field_type: 'text',
      is_required: false,
      field_order: 0,
      is_exportable: true,
      is_importable: true,
      is_visible: true,
      is_enabled: true,
    },
    mode: 'onSubmit',
  });

  // Update form schema when userRole or userStoreId changes
  useEffect(() => {
    form.clearErrors('shop_id');
  }, [userRole, userStoreId, form]);

  useEffect(() => {
    if (customField && open) {
      // For admin, use their shop_id if customField doesn't have one or if they're not superadmin
      const shopId = userRole !== 'superadmin' && userStoreId 
        ? userStoreId 
        : (customField.shop_id || customField.shopId || '');
      
      form.reset({
        shop_id: shopId,
        name: customField.name || '',
        field_key: customField.field_key || '',
        description: customField.description || '',
        field_type: customField.field_type || 'text',
        is_required: customField.is_required ?? customField.isRequired ?? false,
        field_order: customField.field_order ?? customField.fieldOrder ?? 0,
        is_exportable: customField.is_exportable ?? customField.isExportable ?? true,
        is_importable: customField.is_importable ?? customField.isImportable ?? true,
        is_visible: customField.is_visible ?? customField.isVisible ?? true,
        is_enabled: customField.is_enabled ?? customField.isEnabled ?? true,
      });
    }
  }, [customField, open, form, userRole, userStoreId]);

  useEffect(() => {
    // Auto-fill shop_id for admin when editing
    if (open && userStoreId && userRole !== 'superadmin' && customField) {
      form.setValue('shop_id', userStoreId, { shouldValidate: true });
    }
  }, [open, userStoreId, userRole, customField, form]);

  const onSubmit = async (data) => {
    if (!customField?.id) return;

    try {
      // Ensure shop_id is set for admin before validation
      const finalShopId = data.shop_id || userStoreId;
      if (!finalShopId) {
        toast.error('ไม่พบรหัสร้านค้า');
        return;
      }

      // Set shop_id if it's missing (for admin)
      if (!data.shop_id && userStoreId && userRole !== 'superadmin') {
        form.setValue('shop_id', userStoreId, { shouldValidate: true });
        // Re-validate the form
        const isValid = await form.trigger('shop_id');
        if (!isValid) {
          return;
        }
      }

      // Validate required fields manually if needed
      if (!data.name || !data.field_key) {
        toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }

      const updateData = {
        shop_id: finalShopId,
        name: data.name,
        field_key: data.field_key,
        description: data.description || null,
        field_type: data.field_type,
        is_required: data.is_required,
        field_order: data.field_order || 0,
        is_exportable: data.is_exportable,
        is_importable: data.is_importable,
        is_visible: data.is_visible,
        is_enabled: data.is_enabled,
      };

      await customFieldsApi.update(customField.id, updateData);
      toast.custom(
        (t) => (
          <Alert variant="mono" icon="primary" onClose={() => toast.dismiss(t)}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>แก้ไข Custom Field สำเร็จ</AlertTitle>
          </Alert>
        ),
        {
          position: 'top-center',
        }
      );
      
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to update custom field:', error);
      toast.error(error.message || 'ไม่สามารถแก้ไข Custom Field ได้');
    }
  };

  const onError = (errors) => {
    console.log('Form validation errors:', errors);
    toast.error('กรุณาตรวจสอบข้อมูลที่กรอก');
  };

  if (!customField) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:w-[600px] sm:max-w-none inset-5 start-auto h-auto rounded-lg p-0 [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="border-b py-3.5 px-5 border-border">
          <SheetTitle className="flex items-center gap-2.5">
            <FileText className="text-primary size-4" />
            แก้ไข Custom Field
          </SheetTitle>
        </SheetHeader>
        <SheetBody className="p-0">
          <ScrollArea className="h-[calc(100dvh-11.75rem)] ps-3 pe-2 me-1">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, onError)}
                className="space-y-6 px-2">
                <FormField
                  control={form.control}
                  name="shop_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รหัสร้านค้า *</FormLabel>
                      <FormControl>
                        <Popover open={storeOpen} onOpenChange={setStoreOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              mode="input"
                              placeholder={!field.value}
                              aria-expanded={storeOpen}
                              disabled={userRole !== 'superadmin'}
                              className="w-full">
                              {field.value
                                ? stores.find((s) => s.id === field.value)?.name
                                : 'เลือกร้านค้า...'}
                              {userRole === 'superadmin' && <ButtonArrow />}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="ค้นหาร้านค้า..." />
                              <CommandList>
                                <CommandEmpty>
                                  {stores.length === 0 ? 'กำลังโหลดร้านค้า...' : 'ไม่พบร้านค้า'}
                                </CommandEmpty>
                                <CommandGroup>
                                  <ScrollArea className="h-[200px]">
                                    {stores.length > 0 ? (
                                      stores.map((store) => (
                                        <CommandItem
                                          key={store.id}
                                          value={store.id}
                                          onSelect={(currentValue) => {
                                            if (userRole === 'superadmin') {
                                              field.onChange(currentValue);
                                              setStoreOpen(false);
                                            }
                                          }}
                                          disabled={userRole !== 'superadmin'}>
                                          {store.name}
                                          {field.value === store.id && <CommandCheck />}
                                        </CommandItem>
                                      ))
                                    ) : (
                                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                        กำลังโหลดร้านค้า...
                                      </div>
                                    )}
                                  </ScrollArea>
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อฟิลด์ *</FormLabel>
                      <FormControl>
                        <Input placeholder="กรุณากรอกชื่อฟิลด์" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="field_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Key *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="กรุณากรอก Field Key (ไม่มีช่องว่าง)" 
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\s/g, '').toLowerCase();
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        ใช้ได้เฉพาะตัวอักษร ตัวเลข และ underscore (ไม่มีช่องว่าง)
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รายละเอียด</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="กรุณากรอกรายละเอียด" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="field_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ประเภทฟิลด์ *</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกประเภทฟิลด์" />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="field_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ลำดับการแสดง</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          value={field.value || 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_required"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          จำเป็นต้องกรอก
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          จำเป็น/ไม่จำเป็น
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_exportable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          สามารถ Export ได้
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          ใช่/ไม่ใช่
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_importable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          สามารถ Import ได้
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          ใช่/ไม่ใช่
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_visible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          สถานะแสดง
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          แสดง/ไม่แสดง
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          สถานะเปิด
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          เปิด/ปิด
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </ScrollArea>
        </SheetBody>

        <SheetFooter className="flex items-center justify-between border-t py-3.5 px-5 border-border">
          <div></div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button onClick={form.handleSubmit(onSubmit, onError)}>
              บันทึก
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

