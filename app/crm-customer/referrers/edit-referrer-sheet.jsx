'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { referrersApi } from '@/lib/api';

const FormSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อ'),
  bank: z.string().optional(),
  description: z.string().optional(),
  reward_type: z.enum(['point', 'cash'], {
    required_error: 'กรุณาเลือกประเภทรางวัล',
  }),
  status: z.string().min(1, 'กรุณาเลือกสถานะ'),
});

export function EditReferrerSheet({ open, onOpenChange, referrer, onSuccess }) {
  const [saving, setSaving] = useState(false);

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      bank: '',
      description: '',
      reward_type: 'point',
      status: '',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (open) {
      if (referrer) {
        form.reset({
          name: referrer.name || '',
          bank: referrer.bank || '',
          description: referrer.description || '',
          reward_type: referrer.reward_type || 'point',
          status: referrer.status || '',
        });
      }
    } else {
      form.reset();
    }
  }, [open, referrer, form]);

  const onSubmit = async (data) => {
    if (!referrer?.id) return;

    try {
      setSaving(true);
      await referrersApi.update(referrer.id, data);
      toast.success('อัพเดทผู้แนะนำสำเร็จ');
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to update referrer:', error);
      toast.error(error.message || 'ไม่สามารถอัพเดทผู้แนะนำได้');
    } finally {
      setSaving(false);
    }
  };

  const onError = (errors) => {
    console.log('Form validation errors:', errors);
    toast.error('กรุณาตรวจสอบข้อมูลที่กรอก');
  };

  if (!referrer) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            แก้ไขผู้แนะนำ
          </SheetTitle>
        </SheetHeader>
        <SheetBody className="p-0">
          <ScrollArea className="h-[calc(100dvh-11.75rem)] ps-3 pe-2 me-1">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, onError)}
                className="space-y-6 p-6">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อ *</FormLabel>
                      <FormControl>
                        <Input placeholder="กรอกชื่อ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bank */}
                <FormField
                  control={form.control}
                  name="bank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ธนาคาร</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="กรอกชื่อธนาคาร (ไม่บังคับ)"
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รายละเอียด</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="กรอกรายละเอียด (ไม่บังคับ)"
                          {...field}
                          rows={3}
                        />
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                          <SelectItem value="open">เปิด</SelectItem>
                          <SelectItem value="close">ปิด</SelectItem>
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
