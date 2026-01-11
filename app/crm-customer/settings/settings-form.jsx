'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Settings, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button, ButtonArrow } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { settingsApi, storeApi } from '@/lib/api';

const FormSchema = z.object({
  shop_id: z.string().min(1, 'กรุณาเลือกร้านค้า'),
  total_check_tax: z.string().optional(),
  rate_register_point: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return '';
      return String(val);
    },
    z.string().optional()
  ),
  rate_total_point: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return '';
      return String(val);
    },
    z.string().optional()
  ),
});

export default function SettingsForm() {
  const [stores, setStores] = useState([]);
  const [storeOpen, setStoreOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userStoreId, setUserStoreId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      shop_id: '',
      total_check_tax: '',
      rate_register_point: '',
      rate_total_point: '',
    },
    mode: 'onChange',
  });

  const watchedShopId = form.watch('shop_id');

  useEffect(() => {
    loadUserInfo();
    loadStores();
  }, []);

  useEffect(() => {
    // รอให้ userRole โหลดเสร็จก่อน
    if (userRole === null) return;
    
    if (userRole !== 'superadmin') {
      // Admin role
      // ตรวจสอบ userStoreId อย่างเข้มงวด
      const isValidShopId = userStoreId && 
                            userStoreId !== 'undefined' && 
                            userStoreId !== 'null' &&
                            typeof userStoreId === 'string' &&
                            userStoreId.trim() !== '';
      
      if (isValidShopId) {
        // มี shop_id: auto-fill และโหลด settings
        console.log('Admin: Setting shop_id and loading settings:', userStoreId, 'type:', typeof userStoreId);
        form.setValue('shop_id', userStoreId);
        loadSettings(userStoreId);
      } else {
        // ไม่มี shop_id: set loading เป็น false
        console.warn('Admin: No valid shop_id found. userStoreId:', userStoreId, 'type:', typeof userStoreId);
        setLoading(false);
        toast.error('ไม่พบรหัสร้านค้า กรุณาติดต่อผู้ดูแลระบบ');
      }
    } else {
      // Superadmin role: ถ้ายังไม่มี shop_id ให้ set loading เป็น false
      const isValidShopId = watchedShopId && 
                            watchedShopId !== 'undefined' && 
                            watchedShopId !== 'null' &&
                            typeof watchedShopId === 'string' &&
                            watchedShopId.trim() !== '';
      
      if (!isValidShopId) {
        setLoading(false);
      }
    }
  }, [userStoreId, userRole, form, watchedShopId]);

  const loadUserInfo = () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const role = user.role || user.level;
          // ตรวจสอบหลายรูปแบบของ shop_id
          const shopId = user.shop_id || user.storeId || user.store_id || user.shopId;
          
          console.log('Settings - Loaded user info - role:', role, 'shop_id:', shopId, 'type:', typeof shopId);
          console.log('Settings - Full user object:', JSON.stringify(user, null, 2));
          
          // Validate shopId before setting
          if (shopId && 
              shopId !== 'undefined' && 
              shopId !== 'null' &&
              typeof shopId === 'string' &&
              shopId.trim() !== '') {
            setUserRole(role);
            setUserStoreId(shopId);
          } else {
            console.warn('Settings - Invalid shop_id in user object:', shopId);
            setUserRole(role);
            setUserStoreId(null); // Set to null instead of undefined
            if (role !== 'superadmin') {
              setLoading(false);
            }
          }
        } catch (e) {
          console.error('Failed to parse user info:', e);
          setUserRole('admin'); // Default role
          setUserStoreId(null);
          setLoading(false);
        }
      } else {
        // ไม่มี user data
        console.warn('Settings - No user data in localStorage');
        setUserRole('admin'); // Default role
        setUserStoreId(null);
        setLoading(false);
      }
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

  const loadSettings = async (shopId) => {
    // Validate shopId before calling API - ตรวจสอบอย่างเข้มงวด
    if (!shopId || 
        shopId === 'undefined' || 
        shopId === 'null' ||
        typeof shopId !== 'string' ||
        shopId.trim() === '') {
      console.warn('Invalid shop_id, skipping loadSettings. shopId:', shopId, 'type:', typeof shopId);
      setLoading(false);
      // ถ้าเป็น admin แต่ไม่มี shop_id ให้แสดง error
      if (userRole !== 'superadmin') {
        toast.error('ไม่พบรหัสร้านค้า กรุณาติดต่อผู้ดูแลระบบ');
      }
      return;
    }

    // ตรวจสอบว่า shopId เป็น valid UUID format (optional แต่ควรมี)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(shopId)) {
      console.warn('shop_id is not a valid UUID format:', shopId);
      // ยังให้ผ่านได้ แต่ log warning
    }

    try {
      setLoading(true);
      console.log('Loading settings for shop_id:', shopId, 'type:', typeof shopId);
      const data = await settingsApi.getByShopId(shopId);
      
      // ถ้าไม่มี record จะ return default values
      form.reset({
        shop_id: shopId,
        total_check_tax: data?.total_check_tax || '',
        rate_register_point: data?.rate_register_point || '',
        rate_total_point: data?.rate_total_point || '',
      });
      console.log('Settings loaded successfully:', data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      // ถ้า error 400, 404 หรือไม่มี record ให้ใช้ค่า default
      // (ตาม spec: ถ้ายังไม่มี record จะ return default)
      if (error.message.includes('400') || 
          error.message.includes('404') || 
          error.message.includes('not found') ||
          error.message.includes('invalid shop_id')) {
        // ถ้าเป็น invalid shop_id หรือยังไม่มี record ใน DB
        // ให้ใช้ค่า default (ตาม spec)
        form.reset({
          shop_id: shopId,
          total_check_tax: '',
          rate_register_point: '',
          rate_total_point: '',
        });
        console.log('Using default settings (no record found in database)');
      } else {
        // Error อื่นๆ ให้แสดง error แต่ยังแสดง form
        toast.error(error.message || 'ไม่สามารถโหลดตั้งค่าได้');
        form.reset({
          shop_id: shopId,
          total_check_tax: '',
          rate_register_point: '',
          rate_total_point: '',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // สำหรับ superadmin: เมื่อเลือกร้านค้าแล้วให้โหลด settings
  useEffect(() => {
    if (userRole === 'superadmin' && watchedShopId) {
      loadSettings(watchedShopId);
    }
  }, [watchedShopId, userRole]);

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      const shopId = data.shop_id;
      
      // Validate shop_id before submitting
      if (!shopId || shopId.trim() === '') {
        toast.error('กรุณาเลือกร้านค้า');
        form.setError('shop_id', {
          type: 'manual',
          message: 'กรุณาเลือกร้านค้า',
        });
        return;
      }
      
      // Convert to string to match backend expectation
      await settingsApi.update(shopId, {
        total_check_tax: data.total_check_tax || '',
        rate_register_point: data.rate_register_point ? String(data.rate_register_point) : '',
        rate_total_point: data.rate_total_point ? String(data.rate_total_point) : '',
      });
      
      toast.success('อัพเดทตั้งค่าสำเร็จ');
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error(error.message || 'ไม่สามารถอัพเดทตั้งค่าได้');
    } finally {
      setSaving(false);
    }
  };

  const onError = (errors) => {
    console.log('Form validation errors:', errors);
    toast.error('กรุณาตรวจสอบข้อมูลที่กรอก');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5 text-primary" />
            ตั้งค่าระบบร้านค้า
          </CardTitle>
          <CardDescription>
            จัดการตั้งค่าระบบร้านค้า
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, onError)}
              className="space-y-6">
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
                              ? stores.find((s) => s.id === userStoreId)?.name || 'กำลังโหลด...'
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
                                    <CommandItem disabled>กำลังโหลดร้านค้า...</CommandItem>
                                  )}
                                </ScrollArea>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormDescription>
                      {userRole !== 'superadmin' 
                        ? 'ร้านค้าของคุณ (ไม่สามารถเปลี่ยนได้)'
                        : 'เลือกร้านค้าที่ต้องการตั้งค่า'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="total_check_tax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ตัวอักษรใช้จับยอดใบเสร็จรับเงิน</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="เช่น TAX" 
                        {...field}
                        maxLength={50}
                      />
                    </FormControl>
                    <FormDescription>
                      ตัวอักษรที่ใช้ในการจับยอดใบเสร็จรับเงิน (เช่น TAX, VAT, ภาษี)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rate_register_point"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>คะแนนสะสมสมัครสมาชิก</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="เช่น 100" 
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>
                      คะแนนสะสมที่ได้รับเมื่อสมัครสมาชิก
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rate_total_point"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>อัตราคำนวณคะแนนสะสมกับยอดรวม</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="เช่น 0.01 หรือ 1.5" 
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>
                      อัตราการคำนวณคะแนนสะสมจากยอดรวม (เช่น 0.01 = 1% ของยอดรวม, 1.5 = 1.5 เท่า)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    'บันทึก'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

