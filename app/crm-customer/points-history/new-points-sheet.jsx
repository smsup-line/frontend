'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Coins, Loader2 } from 'lucide-react';
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
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { customerApi, storeApi, pointsApi } from '@/lib/api';

const FormSchema = z.object({
  shop_id: z.string().optional(),
  customer_id: z.string().min(1, 'กรุณาเลือกลูกค้า'),
  detail: z.string().min(1, 'กรุณากรอกรายละเอียด'),
  points: z.number().min(1, 'กรุณากรอกคะแนนสะสม (ต้องมากกว่า 0)'),
});

export function NewPointsSheet({ open, onOpenChange, onSuccess }) {
  const [customers, setCustomers] = useState([]);
  const [stores, setStores] = useState([]);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userStoreId, setUserStoreId] = useState(null);
  const [saving, setSaving] = useState(false);

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      shop_id: '',
      customer_id: '',
      detail: '',
      points: 0,
    },
    mode: 'onSubmit',
  });

  const watchedShopId = form.watch('shop_id');

  useEffect(() => {
    if (open) {
      loadUserInfo();
      loadStores();
    }
  }, [open]);

  useEffect(() => {
    if (userRole === 'admin' && userStoreId) {
      form.setValue('shop_id', userStoreId);
      loadCustomers();
    }
  }, [userRole, userStoreId, form]);

  useEffect(() => {
    // สำหรับ superadmin: เมื่อเลือกร้านค้าแล้ว ให้ load customers
    if (userRole === 'superadmin' && watchedShopId && watchedShopId !== 'all') {
      loadCustomers();
      // Reset customer_id เมื่อเปลี่ยนร้านค้า
      form.setValue('customer_id', '');
    } else if (userRole === 'superadmin' && (!watchedShopId || watchedShopId === 'all')) {
      // ถ้ายังไม่เลือกร้านค้า หรือเลือก "ทั้งหมด" ให้ clear customers
      setCustomers([]);
      form.setValue('customer_id', '');
    }
  }, [watchedShopId, userRole, form]);

  const loadUserInfo = () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const role = user.role || user.level;
          const shopId = user.shop_id || user.storeId || user.store_id || user.shopId;
          setUserRole(role);
          setUserStoreId(shopId);
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
      toast.error('ไม่สามารถโหลดข้อมูลร้านค้าได้');
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await customerApi.getAll();
      let filteredCustomers = Array.isArray(data) ? data : [];
      
      // Filter customers by shop_id
      if (userRole === 'admin' && userStoreId) {
        // Admin: filter by userStoreId
        filteredCustomers = filteredCustomers.filter(
          (c) => (c.shop_id || c.storeId) === userStoreId
        );
      } else if (userRole === 'superadmin' && watchedShopId && watchedShopId !== 'all') {
        // Superadmin: filter by selected shop_id
        filteredCustomers = filteredCustomers.filter(
          (c) => (c.shop_id || c.storeId) === watchedShopId
        );
      }
      
      setCustomers(filteredCustomers);
    } catch (error) {
      console.error('Failed to load customers:', error);
      toast.error('ไม่สามารถโหลดข้อมูลลูกค้าได้');
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || '-';
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);

      // Validate customer_id
      if (!data.customer_id || data.customer_id === 'undefined' || data.customer_id.trim() === '') {
        toast.error('ไม่พบรหัสลูกค้า กรุณาเลือกลูกค้าใหม่');
        return;
      }

      await pointsApi.addPoints(data.customer_id, {
        detail: data.detail,
        points: Math.round(data.points), // Convert to integer points
      });

      toast.success('เพิ่มคะแนนสะสมสำเร็จ');
      form.reset({
        shop_id: userRole === 'admin' ? userStoreId : '',
        customer_id: '',
        detail: '',
        points: 0,
      });
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to add points:', error);
      toast.error(error.message || 'ไม่สามารถเพิ่มคะแนนสะสมได้');
    } finally {
      setSaving(false);
    }
  };

  const onError = (errors) => {
    console.log('Form validation errors:', errors);
    toast.error('กรุณาตรวจสอบข้อมูลที่กรอก');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Coins className="size-5 text-primary" />
            เพิ่มคะแนนสะสม
          </SheetTitle>
        </SheetHeader>
        <SheetBody className="p-0">
          <ScrollArea className="h-[calc(100dvh-11.75rem)] ps-3 pe-2 me-1">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, onError)}
                className="space-y-6 p-6">
                {/* Shop Selection (for superadmin only) */}
                {userRole === 'superadmin' && (
                  <FormField
                    control={form.control}
                    name="shop_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>เลือกร้านค้า *</FormLabel>
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
                                  ? stores.find((s) => s.id === field.value)?.name || 'เลือกร้านค้า...'
                                  : 'เลือกร้านค้า...'}
                                <ButtonArrow />
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
                                              field.onChange(currentValue);
                                              setStoreOpen(false);
                                            }}>
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
                          เลือกร้านค้าก่อนเพื่อแสดงลิสต์ลูกค้า
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Customer Selection */}
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เลือกลูกค้า *</FormLabel>
                      <FormControl>
                        <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              mode="input"
                              placeholder={!field.value}
                              aria-expanded={customerOpen}
                              disabled={
                                userRole === 'superadmin' && (!watchedShopId || watchedShopId === 'all')
                              }
                              className="w-full">
                              {field.value
                                ? getCustomerName(field.value)
                                : userRole === 'superadmin' && (!watchedShopId || watchedShopId === 'all')
                                ? 'กรุณาเลือกร้านค้าก่อน'
                                : 'เลือกลูกค้า...'}
                              <ButtonArrow />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="ค้นหาลูกค้า..." />
                              <CommandList>
                                <CommandEmpty>
                                  {userRole === 'superadmin' && (!watchedShopId || watchedShopId === 'all')
                                    ? 'กรุณาเลือกร้านค้าก่อน'
                                    : customers.length === 0
                                    ? 'กำลังโหลดลูกค้า...'
                                    : 'ไม่พบลูกค้า'}
                                </CommandEmpty>
                                <CommandGroup>
                                  <ScrollArea className="h-[200px]">
                                    {customers.length > 0 ? (
                                      customers.map((customer) => (
                                        <CommandItem
                                          key={customer.id}
                                          value={customer.id}
                                          onSelect={(currentValue) => {
                                            field.onChange(currentValue);
                                            setCustomerOpen(false);
                                          }}>
                                          {customer.name}
                                          {field.value === customer.id && <CommandCheck />}
                                        </CommandItem>
                                      ))
                                    ) : (
                                      <CommandItem disabled>
                                        {userRole === 'superadmin' && (!watchedShopId || watchedShopId === 'all')
                                          ? 'กรุณาเลือกร้านค้าก่อน'
                                          : 'กำลังโหลดลูกค้า...'}
                                      </CommandItem>
                                    )}
                                  </ScrollArea>
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormDescription>
                        {userRole === 'superadmin'
                          ? 'กรุณาเลือกร้านค้าก่อนเพื่อแสดงลิสต์ลูกค้า'
                          : 'เลือกลูกค้าที่ต้องการเพิ่มคะแนนสะสม'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Detail */}
                <FormField
                  control={form.control}
                  name="detail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รายละเอียด *</FormLabel>
                      <FormControl>
                        <Input placeholder="กรอกรายละเอียดคะแนนสะสม" {...field} />
                      </FormControl>
                      <FormDescription>
                        รายละเอียดเกี่ยวกับคะแนนสะสมที่เพิ่มให้ลูกค้า
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Points */}
                <FormField
                  control={form.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>คะแนนสะสม *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          min="1"
                          step="1"
                        />
                      </FormControl>
                      <FormDescription>
                        จำนวนคะแนนสะสมที่ต้องการเพิ่มให้ลูกค้า (ต้องเป็นจำนวนเต็มบวก)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </ScrollArea>
        </SheetBody>
        <SheetFooter className="px-6 py-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}>
            ยกเลิก
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit, onError)}
            disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              'บันทึก'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

