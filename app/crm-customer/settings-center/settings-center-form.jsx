'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Settings, Loader2 } from 'lucide-react';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { settingsCenterApi } from '@/lib/api';

const FormSchema = z.object({
  rate_commission_point: z.string().optional(),
  rate_commission_cash: z.string().optional(),
});

export default function SettingsCenterForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      rate_commission_point: '',
      rate_commission_cash: '',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsCenterApi.get();
      
      form.reset({
        rate_commission_point: data?.rate_commission_point || '',
        rate_commission_cash: data?.rate_commission_cash || '',
      });
      console.log('Settings center loaded successfully:', data);
    } catch (error) {
      console.error('Failed to load settings center:', error);
      // ถ้า error 400, 404 หรือไม่มี record ให้ใช้ค่า default
      if (error.message.includes('400') || 
          error.message.includes('404') || 
          error.message.includes('not found')) {
        form.reset({
          rate_commission_point: '',
          rate_commission_cash: '',
        });
        console.log('Using default settings center (no record found in database)');
      } else {
        toast.error(error.message || 'ไม่สามารถโหลดตั้งค่าได้');
        form.reset({
          rate_commission_point: '',
          rate_commission_cash: '',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      
      // Convert to string to match backend expectation
      await settingsCenterApi.update({
        rate_commission_point: data.rate_commission_point ? String(data.rate_commission_point) : '',
        rate_commission_cash: data.rate_commission_cash ? String(data.rate_commission_cash) : '',
      });
      
      toast.success('อัพเดทตั้งค่าสำเร็จ');
    } catch (error) {
      console.error('Failed to update settings center:', error);
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
            ตั้งค่าระบบส่วนกลาง
          </CardTitle>
          <CardDescription>
            จัดการตั้งค่าระบบส่วนกลางสำหรับระบบแนะนำเพื่อน
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, onError)}
              className="space-y-6">
              <FormField
                control={form.control}
                name="rate_commission_point"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เรทแนะนำเพื่อนแบบคะแนนสะสม</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="เช่น 50" 
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>
                      เรทคอมมิชชั่นแนะนำเพื่อนแบบคะแนนสะสม
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rate_commission_cash"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เรทแนะนำเพื่อนแบบเงินสด</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="เช่น 100.00" 
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>
                      เรทคอมมิชชั่นแนะนำเพื่อนแบบเงินสด
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

