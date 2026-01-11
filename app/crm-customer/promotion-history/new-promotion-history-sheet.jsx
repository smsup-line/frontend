'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { History, Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { promotionHistoryApi, promotionsApi, customerApi, storeApi, branchApi, pointsApi } from '@/lib/api';

const FormSchema = z.object({
  promotion_id: z.string().min(1, 'กรุณาเลือกโปรโมชั่น'),
  customer_id: z.string().min(1, 'กรุณาเลือกลูกค้า'),
  points_used: z.number().min(1, 'กรุณากรอกคะแนนสะสม'),
  status: z.enum(['pending', 'approved', 'rejected'], {
    required_error: 'กรุณาเลือกสถานะ',
  }),
  shop_id: z.string().min(1, 'กรุณาเลือกร้านค้า'),
  branch_id: z.string().optional(),
});

export function NewPromotionHistorySheet({ open, onOpenChange, promotionId, onSuccess }) {
  const [promotions, setPromotions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stores, setStores] = useState([]);
  const [branches, setBranches] = useState([]);
  const [promotionOpen, setPromotionOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userStoreId, setUserStoreId] = useState(null);
  const [selectedStoreId, setSelectedStoreId] = useState('');

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      promotion_id: promotionId || '',
      customer_id: '',
      points_used: 0,
      status: 'pending',
      shop_id: '',
      branch_id: '',
    },
    mode: 'onSubmit',
  });

  const watchedStoreId = form.watch('shop_id');

  useEffect(() => {
    if (open) {
      loadUserInfo();
      loadPromotions();
      loadStores();
      if (promotionId) {
        form.setValue('promotion_id', promotionId);
      }
    }
  }, [open, promotionId, form]);

  useEffect(() => {
    if (watchedStoreId) {
      loadBranches(watchedStoreId);
      loadCustomers(watchedStoreId);
      setSelectedStoreId(watchedStoreId);
    } else {
      setBranches([]);
      setCustomers([]);
    }
  }, [watchedStoreId]);

  const loadUserInfo = () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserRole(user.role);
          setUserStoreId(user.shop_id || user.storeId);
          if (user.role !== 'superadmin') {
            form.setValue('shop_id', user.shop_id || user.storeId);
          }
        } catch (e) {
          console.error('Failed to parse user info:', e);
        }
      }
    }
  };

  const loadPromotions = async () => {
    try {
      const data = await promotionsApi.getAll();
      setPromotions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load promotions:', error);
      toast.error('ไม่สามารถโหลดข้อมูลโปรโมชั่นได้');
    }
  };

  const loadCustomers = async (shopId) => {
    if (!shopId) {
      setCustomers([]);
      return;
    }
    try {
      const data = await customerApi.getAll({ shop_id: shopId });
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load customers:', error);
      setCustomers([]);
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

  const loadBranches = async (storeId) => {
    if (!storeId) return;
    try {
      const data = await branchApi.getAll({ storeId });
      setBranches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load branches:', error);
      setBranches([]);
    }
  };

  // Auto-fill points_used when promotion is selected
  useEffect(() => {
    const promotionId = form.watch('promotion_id');
    if (promotionId && promotions.length > 0) {
      const selectedPromotion = promotions.find(p => p.id === promotionId);
      if (selectedPromotion && selectedPromotion.points != null) {
        form.setValue('points_used', selectedPromotion.points, { shouldValidate: true });
      }
    }
  }, [form.watch('promotion_id'), promotions, form]);

  const getPromotionName = (promotionId) => {
    const promotion = promotions.find(p => p.id === promotionId);
    return promotion?.name || '-';
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || '-';
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      
      // Get promotion details
      const selectedPromotion = promotions.find(p => p.id === data.promotion_id);
      const promotionName = selectedPromotion?.name || 'โปรโมชั่น';
      
      // Create promotion history
      await promotionHistoryApi.create(data);
      
      // Create points history if status is approved or rejected
      if (data.status === 'approved' || data.status === 'rejected') {
        try {
          // For approved: deduct points (negative value)
          // For rejected: refund points (positive integer value - return points to customer)
          const pointsValue = data.status === 'approved' 
            ? -Math.abs(data.points_used)  // Negative for deduction
            : Math.abs(Math.round(data.points_used));  // Positive integer for refund
          
          const detail = data.status === 'approved'
            ? promotionName
            : `${promotionName} (คืนคะแนนสะสม)`;
          
          await pointsApi.addPoints(data.customer_id, {
            detail: detail,
            points: pointsValue,
          });
        } catch (pointsError) {
          console.error('Failed to create points history:', pointsError);
          // Don't fail the whole operation if points history creation fails
          toast.error('สร้างประวัติการใช้โปรโมชั่นสำเร็จ แต่ไม่สามารถสร้างประวัติคะแนนสะสมได้');
        }
      }
      
      toast.success('เพิ่มประวัติการใช้โปรโมชั่นสำเร็จ');
      form.reset({
        promotion_id: promotionId || '',
        customer_id: '',
        points_used: 0,
        status: 'pending',
        shop_id: userRole !== 'superadmin' ? userStoreId : '',
        branch_id: '',
      });
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to create promotion history:', error);
      toast.error(error.message || 'ไม่สามารถเพิ่มประวัติการใช้โปรโมชั่นได้');
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
      <SheetContent className="sm:w-[600px] sm:max-w-none inset-5 start-auto h-auto rounded-lg p-0 [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="border-b py-3.5 px-5 border-border">
          <SheetTitle className="flex items-center gap-2.5">
            <History className="text-primary size-4" />
            เพิ่มประวัติการใช้โปรโมชั่น
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
                      <FormLabel>ร้านค้า *</FormLabel>
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
                                : userStoreId
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

                {watchedStoreId && (
                  <FormField
                    control={form.control}
                    name="branch_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>สาขา</FormLabel>
                        <FormControl>
                          <Popover open={branchOpen} onOpenChange={setBranchOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                mode="input"
                                placeholder={!field.value}
                                aria-expanded={branchOpen}
                                className="w-full">
                                {field.value
                                  ? branches.find((b) => b.id === field.value)?.name
                                  : 'เลือกสาขา...'}
                                <ButtonArrow />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="ค้นหาสาขา..." />
                                <CommandList>
                                  <CommandEmpty>
                                    {branches.length === 0 ? 'ไม่มีสาขา' : 'ไม่พบสาขา'}
                                  </CommandEmpty>
                                  <CommandGroup>
                                    <ScrollArea className="h-[200px]">
                                      {branches.length > 0 ? (
                                        branches.map((branch) => (
                                          <CommandItem
                                            key={branch.id}
                                            value={branch.id}
                                            onSelect={(currentValue) => {
                                              field.onChange(currentValue);
                                              setBranchOpen(false);
                                            }}>
                                            {branch.name}
                                            {field.value === branch.id && <CommandCheck />}
                                          </CommandItem>
                                        ))
                                      ) : (
                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                          ไม่มีสาขา
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
                )}

                <FormField
                  control={form.control}
                  name="promotion_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>โปรโมชั่น *</FormLabel>
                      <FormControl>
                        <Popover open={promotionOpen} onOpenChange={setPromotionOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              mode="input"
                              placeholder={!field.value}
                              aria-expanded={promotionOpen}
                              className="w-full">
                              {field.value
                                ? getPromotionName(field.value)
                                : 'เลือกโปรโมชั่น...'}
                              <ButtonArrow />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="ค้นหาโปรโมชั่น..." />
                              <CommandList>
                                <CommandEmpty>
                                  {promotions.length === 0 ? 'กำลังโหลดโปรโมชั่น...' : 'ไม่พบโปรโมชั่น'}
                                </CommandEmpty>
                                <CommandGroup>
                                  <ScrollArea className="h-[200px]">
                                    {promotions.length > 0 ? (
                                      promotions.map((promotion) => (
                                        <CommandItem
                                          key={promotion.id}
                                          value={promotion.id}
                                          onSelect={(currentValue) => {
                                            field.onChange(currentValue);
                                            setPromotionOpen(false);
                                          }}>
                                          {promotion.name}
                                          {field.value === promotion.id && <CommandCheck />}
                                        </CommandItem>
                                      ))
                                    ) : (
                                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                        กำลังโหลดโปรโมชั่น...
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
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ลูกค้า *</FormLabel>
                      <FormControl>
                        <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              mode="input"
                              placeholder={!field.value}
                              aria-expanded={customerOpen}
                              disabled={!watchedStoreId}
                              className="w-full">
                              {field.value
                                ? getCustomerName(field.value)
                                : !watchedStoreId
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
                                  {customers.length === 0 ? 'ไม่มีลูกค้า' : 'ไม่พบลูกค้า'}
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
                                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                        ไม่มีลูกค้า
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
                  name="points_used"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ใช้คะแนนสะสม *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          value={field.value ?? 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>สถานะ *</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกสถานะ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">รอดำเนินการ</SelectItem>
                            <SelectItem value="approved">อนุมัติ</SelectItem>
                            <SelectItem value="rejected">ไม่อนุมัติ</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
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
            <Button onClick={form.handleSubmit(onSubmit, onError)} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                'บันทึก'
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

