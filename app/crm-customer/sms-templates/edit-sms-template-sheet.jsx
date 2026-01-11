'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill } from '@remixicon/react';
import { MessageSquare } from 'lucide-react';
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
import { smsTemplatesApi, customFieldsApi, storeApi } from '@/lib/api';

const FormSchema = z.object({
  shop_id: z.string().min(1, 'กรุณาเลือกร้านค้า'),
  name: z.string().min(1, 'กรุณากรอกชื่อ'),
  description: z.string().min(1, 'กรุณากรอกรายละเอียด'),
});

export function EditSmsTemplateSheet({ open, onOpenChange, template, stores: storesProp, onSuccess }) {
  const [customFields, setCustomFields] = useState([]);
  const [stores, setStores] = useState(storesProp || []);
  const [storeOpen, setStoreOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
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

  const loadCustomFields = async (shopId) => {
    if (!shopId) {
      setCustomFields([]);
      return;
    }
    try {
      const data = await customFieldsApi.getAll({ shop_id: shopId });
      // Filter only visible custom fields
      const visibleFields = Array.isArray(data) 
        ? data.filter((field) => field.is_visible ?? field.isVisible ?? true)
        : [];
      setCustomFields(visibleFields);
      console.log('Loaded custom fields for shop:', shopId, visibleFields.length, visibleFields);
    } catch (error) {
      console.error('Failed to load custom fields:', error);
      setCustomFields([]);
    }
  };

  const loadUserInfo = () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const role = user.role || user.level;
          // ตรวจสอบหลายรูปแบบ: shop_id, storeId, store_id
          const shopId = user.shop_id || user.storeId || user.store_id || user.shopId;
          console.log('Loaded user info - role:', role, 'shop_id:', shopId, 'full user:', user);
          setUserRole(role);
          setUserStoreId(shopId);
        } catch (e) {
          console.error('Failed to parse user info:', e);
        }
      }
    }
  };

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      shop_id: '',
      name: '',
      description: '',
    },
    mode: 'onSubmit',
  });

  const watchedStoreId = form.watch('shop_id');

  useEffect(() => {
    if (watchedStoreId) {
      setSelectedStoreId(watchedStoreId);
    } else {
      setSelectedStoreId(null);
    }
  }, [watchedStoreId]);

  // Load custom fields for admin immediately when form opens and userStoreId is available
  useEffect(() => {
    if (open && userStoreId && userRole && userRole !== 'superadmin') {
      console.log('Loading custom fields for admin, shop_id:', userStoreId);
      loadCustomFields(userStoreId);
    } else if (open && userRole === 'superadmin') {
      // For superadmin, clear custom fields until shop is selected
      setCustomFields([]);
    }
  }, [open, userStoreId, userRole]);

  // Load custom fields for superadmin when shop is selected
  useEffect(() => {
    if (selectedStoreId && userRole === 'superadmin') {
      loadCustomFields(selectedStoreId);
    } else if (userRole === 'superadmin' && !selectedStoreId) {
      setCustomFields([]);
    }
  }, [selectedStoreId, userRole]);

  useEffect(() => {
    if (template && open) {
      // For admin, use their shop_id; for superadmin, use template's shop_id
      const shopId = userRole !== 'superadmin' && userStoreId 
        ? userStoreId 
        : (template.shop_id || template.shopId || '');
      
      form.reset({
        shop_id: shopId,
        name: template.name || '',
        description: template.description || '',
      });
      
      if (shopId) {
        setSelectedStoreId(shopId);
        // Load custom fields for the shop
        loadCustomFields(shopId);
      }
    }
  }, [template, open, form, userRole, userStoreId]);

  const insertCustomField = (fieldKey) => {
    const currentValue = form.getValues('description');
    const newValue = currentValue + ` {{${fieldKey}}}`;
    form.setValue('description', newValue);
  };

  const onSubmit = async (data) => {
    if (!template?.id) return;

    try {
      const updateData = {
        shop_id: data.shop_id,
        name: data.name,
        description: data.description,
      };

      await smsTemplatesApi.update(template.id, updateData);
      toast.custom(
        (t) => (
          <Alert variant="mono" icon="primary" onClose={() => toast.dismiss(t)}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>แก้ไข SMS Template สำเร็จ</AlertTitle>
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
      console.error('Failed to update SMS template:', error);
      toast.error(error.message || 'ไม่สามารถแก้ไข SMS Template ได้');
    }
  };

  const onError = (errors) => {
    console.log('Form validation errors:', errors);
    toast.error('กรุณาตรวจสอบข้อมูลที่กรอก');
  };

  if (!template) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:w-[600px] sm:max-w-none inset-5 start-auto h-auto rounded-lg p-0 [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="border-b py-3.5 px-5 border-border">
          <SheetTitle className="flex items-center gap-2.5">
            <MessageSquare className="text-primary size-4" />
            แก้ไข SMS Template
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
                                ? stores.find((s) => s.id === field.value)?.name || 'เลือกร้านค้า...'
                                : userStoreId && userRole !== 'superadmin'
                                ? 'กำลังโหลด...'
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
                      <FormLabel>ชื่อ *</FormLabel>
                      <FormControl>
                        <Input placeholder="กรุณากรอกชื่อ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รายละเอียด *</FormLabel>
                      <div className="mb-3">
                        <p className="text-sm font-medium text-foreground mb-2">
                          แทรกตัวแปรข้อมูลลูกค้า (Merge Tags)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {/* ข้อมูลพื้นฐานของลูกค้า - แสดงเสมอ */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => insertCustomField('name')}
                            className="text-xs">
                            {'{{name}}'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => insertCustomField('telephone')}
                            className="text-xs">
                            {'{{telephone}}'}
                          </Button>
                          {/* Custom Fields */}
                          {customFields.map((customField) => (
                            <Button
                              key={customField.id}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => insertCustomField(customField.field_key)}
                              className="text-xs">
                              {`{{${customField.field_key}}}`}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder="กรุณากรอกรายละเอียด (ใช้ {'{{'}field_name{'}}'} สำหรับ Custom Fields)" 
                          {...field}
                          rows={8}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        ใช้ {'{{'}field_name{'}}'} เพื่อแทรก Custom Fields
                      </p>
                      <FormMessage />
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

