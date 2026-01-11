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
import { referralHistoryApi, referrersApi, adminApi, settingsCenterApi } from '@/lib/api';

const FormSchema = z.object({
  referrer_id: z.string().min(1, 'กรุณาเลือกผู้แนะนำ'),
  referee_id: z.string().min(1, 'กรุณาเลือกผู้ถูกแนะนำ'),
  reward_type: z.enum(['point', 'cash'], {
    required_error: 'กรุณาเลือกประเภทรางวัล',
  }),
  reward_value: z.number().min(0.01, 'กรุณากรอกมูลค่ารางวัล'),
  status: z.enum(['pending', 'approved', 'paid'], {
    required_error: 'กรุณาเลือกสถานะ',
  }),
});

export function EditReferralHistorySheet({ open, onOpenChange, historyItem, onSuccess }) {
  const [referrers, setReferrers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [referrerOpen, setReferrerOpen] = useState(false);
  const [refereeOpen, setRefereeOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingsCenter, setSettingsCenter] = useState(null);

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      referrer_id: '',
      referee_id: '',
      reward_type: 'point',
      reward_value: 0,
      status: 'pending',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (open) {
      loadSettingsCenter();
      loadReferrers();
      loadAdmins();
      if (historyItem) {
        form.reset({
          referrer_id: historyItem.referrer_id || '',
          referee_id: historyItem.referee_id || '',
          reward_type: historyItem.reward_type || 'point',
          reward_value: historyItem.reward_value || 0,
          status: historyItem.status || 'pending',
        });
      }
    } else {
      form.reset();
    }
  }, [open, historyItem, form]);

  // Auto-fill reward_type และ reward_value เมื่อ referrer ถูกเลือก
  const watchedReferrerId = form.watch('referrer_id');
  useEffect(() => {
    if (open && watchedReferrerId && referrers.length > 0 && settingsCenter) {
      const selectedReferrer = referrers.find(r => r.id === watchedReferrerId);
      if (selectedReferrer && selectedReferrer.reward_type) {
        form.setValue('reward_type', selectedReferrer.reward_type, { shouldValidate: true });
        updateRewardValue(selectedReferrer.reward_type);
      }
    }
  }, [open, watchedReferrerId, referrers, settingsCenter, form]);

  const loadSettingsCenter = async () => {
    try {
      const data = await settingsCenterApi.get();
      setSettingsCenter(data);
    } catch (error) {
      console.error('Failed to load settings center:', error);
      setSettingsCenter(null);
    }
  };

  const loadReferrers = async () => {
    try {
      const data = await referrersApi.getAll();
      setReferrers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load referrers:', error);
      toast.error('ไม่สามารถโหลดข้อมูลผู้แนะนำได้');
    }
  };

  const loadAdmins = async () => {
    try {
      const data = await adminApi.getAll();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load admins:', error);
      toast.error('ไม่สามารถโหลดข้อมูลผู้ดูแลระบบได้');
    }
  };

  const getReferrerName = (referrerId) => {
    const referrer = referrers.find(r => r.id === referrerId);
    return referrer?.name || '-';
  };

  const getAdminName = (adminId) => {
    const admin = admins.find(a => a.id === adminId);
    return admin ? `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || admin.username || '-' : '-';
  };

  // Auto-fill reward_value เมื่อ reward_type เปลี่ยน
  const watchedRewardType = form.watch('reward_type');
  useEffect(() => {
    if (watchedRewardType && settingsCenter && open) {
      updateRewardValue(watchedRewardType);
    }
  }, [watchedRewardType, settingsCenter, open]);

  const updateRewardValue = (rewardType) => {
    if (!settingsCenter) return;
    
    if (rewardType === 'point' && settingsCenter.rate_commission_point) {
      const value = parseFloat(settingsCenter.rate_commission_point) || 0;
      form.setValue('reward_value', value, { shouldValidate: true });
    } else if (rewardType === 'cash' && settingsCenter.rate_commission_cash) {
      const value = parseFloat(settingsCenter.rate_commission_cash) || 0;
      form.setValue('reward_value', value, { shouldValidate: true });
    }
  };

  const onSubmit = async (data) => {
    if (!historyItem?.id) return;

    try {
      setSaving(true);
      await referralHistoryApi.update(historyItem.id, data);
      toast.success('อัพเดทประวัติการแนะนำสำเร็จ');
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to update referral history:', error);
      toast.error(error.message || 'ไม่สามารถอัพเดทประวัติการแนะนำได้');
    } finally {
      setSaving(false);
    }
  };

  const onError = (errors) => {
    console.log('Form validation errors:', errors);
    toast.error('กรุณาตรวจสอบข้อมูลที่กรอก');
  };

  if (!historyItem) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="size-5 text-primary" />
            แก้ไขประวัติการแนะนำ
          </SheetTitle>
        </SheetHeader>
        <SheetBody className="p-0">
          <ScrollArea className="h-[calc(100dvh-11.75rem)] ps-3 pe-2 me-1">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, onError)}
                className="space-y-6 p-6">
                {/* Referrer Selection */}
                <FormField
                  control={form.control}
                  name="referrer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ผู้แนะนำ *</FormLabel>
                      <FormControl>
                        <Popover open={referrerOpen} onOpenChange={setReferrerOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              mode="input"
                              placeholder={!field.value}
                              aria-expanded={referrerOpen}
                              className="w-full">
                              {field.value
                                ? getReferrerName(field.value)
                                : 'เลือกผู้แนะนำ...'}
                              <ButtonArrow />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="ค้นหาผู้แนะนำ..." />
                              <CommandList>
                                <CommandEmpty>
                                  {referrers.length === 0 ? 'กำลังโหลดผู้แนะนำ...' : 'ไม่พบผู้แนะนำ'}
                                </CommandEmpty>
                                <CommandGroup>
                                  <ScrollArea className="h-[200px]">
                                    {referrers.length > 0 ? (
                                      referrers.map((referrer) => (
                                        <CommandItem
                                          key={referrer.id}
                                          value={referrer.id}
                                          onSelect={(currentValue) => {
                                            field.onChange(currentValue);
                                            // Auto-fill reward_type จาก referrer
                                            const selectedReferrer = referrers.find(r => r.id === currentValue);
                                            if (selectedReferrer && selectedReferrer.reward_type) {
                                              form.setValue('reward_type', selectedReferrer.reward_type, { shouldValidate: true });
                                              // Auto-fill reward_value จาก settings-center
                                              updateRewardValue(selectedReferrer.reward_type);
                                            }
                                            setReferrerOpen(false);
                                          }}>
                                          {referrer.name}
                                          {field.value === referrer.id && <CommandCheck />}
                                        </CommandItem>
                                      ))
                                    ) : (
                                      <CommandItem disabled>กำลังโหลดผู้แนะนำ...</CommandItem>
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

                {/* Referee Selection */}
                <FormField
                  control={form.control}
                  name="referee_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ผู้ถูกแนะนำ *</FormLabel>
                      <FormControl>
                        <Popover open={refereeOpen} onOpenChange={setRefereeOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              mode="input"
                              placeholder={!field.value}
                              aria-expanded={refereeOpen}
                              className="w-full">
                              {field.value
                                ? getAdminName(field.value)
                                : 'เลือกผู้ถูกแนะนำ...'}
                              <ButtonArrow />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="ค้นหาผู้ดูแลระบบ..." />
                              <CommandList>
                                <CommandEmpty>
                                  {admins.length === 0 ? 'กำลังโหลดผู้ดูแลระบบ...' : 'ไม่พบผู้ดูแลระบบ'}
                                </CommandEmpty>
                                <CommandGroup>
                                  <ScrollArea className="h-[200px]">
                                    {admins.length > 0 ? (
                                      admins.map((admin) => {
                                        const displayName = `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || admin.username || admin.id;
                                        return (
                                          <CommandItem
                                            key={admin.id}
                                            value={admin.id}
                                            onSelect={(currentValue) => {
                                              field.onChange(currentValue);
                                              setRefereeOpen(false);
                                            }}>
                                            {displayName}
                                            {field.value === admin.id && <CommandCheck />}
                                          </CommandItem>
                                        );
                                      })
                                    ) : (
                                      <CommandItem disabled>กำลังโหลดผู้ดูแลระบบ...</CommandItem>
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

                {/* Reward Type */}
                <FormField
                  control={form.control}
                  name="reward_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ประเภทรางวัล *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกประเภทรางวัล" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="point">คะแนนสะสม</SelectItem>
                          <SelectItem value="cash">เงินสด</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Reward Value */}
                <FormField
                  control={form.control}
                  name="reward_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>มูลค่ารางวัล *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          step="0.01"
                          disabled={true}
                          min="0"
                          value={field.value || ''}
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>สถานะ *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกสถานะ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">รอดำเนินการ</SelectItem>
                          <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                          <SelectItem value="paid">จ่ายแล้ว</SelectItem>
                        </SelectContent>
                      </Select>
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

