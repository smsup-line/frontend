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
import { smsTemplatesApi, storeApi, customFieldsApi } from '@/lib/api';

const FormSchema = z.object({
  shop_id: z.string().min(1, 'กรุณาเลือกร้านค้า'),
  name: z.string().min(1, 'กรุณากรอกชื่อ'),
  description: z.string().min(1, 'กรุณากรอกรายละเอียด'),
});

export function NewSmsTemplateSheet({ open, onOpenChange }) {
  const [stores, setStores] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [storeOpen, setStoreOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userStoreId, setUserStoreId] = useState(null);
  const [selectedStoreId, setSelectedStoreId] = useState(null);

  useEffect(() => {
    if (open) {
      loadUserInfo();
      loadStores();
    }
  }, [open]);

  // Load custom fields for admin immediately when form opens and userStoreId is available
  useEffect(() => {
    if (open && userStoreId && userRole && userRole !== 'superadmin') {
      console.log('Loading custom fields for admin, shop_id:', userStoreId, 'role:', userRole);
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

  const loadStores = async () => {
    try {
      const data = await storeApi.getAll();
      setStores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load stores:', error);
      toast.error('ไม่สามารถโหลดข้อมูลร้านค้าได้');
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

  useEffect(() => {
    if (!open) {
      form.reset({
        shop_id: userStoreId || '',
        name: '',
        description: '',
      });
      setSelectedStoreId(null);
      setCustomFields([]);
    } else if (userStoreId && userRole && userRole !== 'superadmin') {
      form.setValue('shop_id', userStoreId);
    }
  }, [open, form, userStoreId, userRole]);

  const insertCustomField = (fieldKey) => {
    const currentValue = form.getValues('description');
    const newValue = currentValue + ` {{${fieldKey}}}`;
    form.setValue('description', newValue);
  };

  const onSubmit = async (data) => {
    try {
      const templateData = {
        shop_id: data.shop_id,
        name: data.name,
        description: data.description,
      };

      await smsTemplatesApi.create(templateData);
      toast.custom(
        (t) => (
          <Alert variant="mono" icon="primary" onClose={() => toast.dismiss(t)}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>เพิ่ม SMS Template สำเร็จ</AlertTitle>
          </Alert>
        ),
        {
          position: 'top-center',
        }
      );
      
      onOpenChange(false);
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to create SMS template:', error);
      toast.error(error.message || 'ไม่สามารถเพิ่ม SMS Template ได้');
    }
  };

  const onError = (errors) => {
    console.log('Form validation errors:', errors);
    toast.error('กรุณาตรวจสอบข้อมูลที่กรอก');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:w-[600px] sm:max-w-none inset-5 start-auto h-auto rounded-lg p-0 [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="border-b py-3.5 px-5 border-border">
          <SheetTitle className="flex items-center gap-2.5">
            <MessageSquare className="text-primary size-4" />
            เพิ่ม SMS Template
          </SheetTitle>
        </SheetHeader>
        <SheetBody className="p-0">
          <ScrollArea className="h-[calc(100dvh-11.75rem)] ps-3 pe-2 me-1">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, onError)}
                className="space-y-6 px-2">
                {userRole === 'superadmin' && (
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
                                className="w-full">
                                {field.value
                                  ? stores.find((s) => s.id === field.value)?.name
                                  : 'เลือกร้านค้า...'}
                                <ButtonArrow />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="ค้นหาร้านค้า..." />
                                <CommandList>
                                  <CommandEmpty>ไม่พบร้านค้า</CommandEmpty>
                                  <CommandGroup>
                                    <ScrollArea className="h-[200px]">
                                      {stores.map((store) => (
                                        <CommandItem
                                          key={store.id}
                                          value={store.id}
                                          onSelect={(currentValue) => {
                                            field.onChange(currentValue);
                                            setStoreOpen(false);
                                          }}>
                                          {store.name}
                                          {field.value === store.id && <CommandCheck />}
                                        </CommandItem>
                                      ))}
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
                )}

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

