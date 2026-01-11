'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Phone, Shield } from 'lucide-react';
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
import { customerApi } from '@/lib/api';

const FormSchema = z.object({
  phone: z.string().min(10, 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง').regex(/^[0-9]+$/, 'เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น'),
  otp: z.string().optional(),
});

export default function VerifyPhonePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [customerId, setCustomerId] = useState(null);

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      phone: '',
      otp: '',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    // Get customer ID from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.id) {
          setCustomerId(user.id);
        }
      } catch (e) {
        console.error('Failed to parse user info:', e);
      }
    }
  }, []);

  const sendOTP = async (phone) => {
    try {
      setSendingOtp(true);
      // TODO: Call API to send OTP
      // For now, we'll simulate it
      // In production, you would call: await otpApi.sendOTP(phone);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('ส่ง OTP ไปยังเบอร์โทรศัพท์ของคุณแล้ว');
      setOtpSent(true);
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error('ไม่สามารถส่ง OTP ได้');
    } finally {
      setSendingOtp(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      if (!otpSent) {
        // First step: Send OTP
        await sendOTP(data.phone);
        return;
      }

      // Second step: Verify OTP and update customer
      if (!customerId) {
        toast.error('ไม่พบข้อมูลลูกค้า');
        return;
      }

      // TODO: Verify OTP with backend
      // await otpApi.verifyOTP(data.phone, data.otp);
      
      // For now, we'll just update the customer with phone and otp_verify
      const updateData = {
        phone: data.phone,
        otp_verify: true, // Set to true after OTP verification
      };

      await customerApi.update(customerId, updateData);

      // Update user in localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          user.phone = data.phone;
          localStorage.setItem('user', JSON.stringify(user));
        } catch (e) {
          console.error('Failed to update user in localStorage:', e);
        }
      }

      toast.success('ยืนยันเบอร์โทรศัพท์สำเร็จ');
      router.push('/crm-customer/profile');
    } catch (error) {
      console.error('Verify phone error:', error);
      toast.error(error.message || 'ไม่สามารถยืนยันเบอร์โทรศัพท์ได้');
    } finally {
      setLoading(false);
    }
  };

  const onError = (errors) => {
    console.log('Form validation errors:', errors);
    toast.error('กรุณาตรวจสอบข้อมูลที่กรอก');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-border bg-card p-8 shadow-lg mx-auto">
        <div className="flex flex-col items-center space-y-2">
          <div className="rounded-full bg-primary/10 p-3">
            {otpSent ? (
              <Shield className="size-8 text-primary" />
            ) : (
              <Phone className="size-8 text-primary" />
            )}
          </div>
          <h1 className="text-2xl font-bold">
            {otpSent ? 'ยืนยัน OTP' : 'กรอกเบอร์โทรศัพท์'}
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            {otpSent 
              ? 'กรุณากรอก OTP ที่ส่งไปยังเบอร์โทรศัพท์ของคุณ'
              : 'กรุณากรอกเบอร์โทรศัพท์เพื่อยืนยันตัวตน'}
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onError)}
            className="space-y-6">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>เบอร์โทรศัพท์ *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="กรุณากรอกเบอร์โทรศัพท์"
                      {...field}
                      disabled={otpSent || sendingOtp}
                      type="tel"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {otpSent && (
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OTP *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="กรุณากรอก OTP"
                        {...field}
                        disabled={loading}
                        maxLength={6}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || sendingOtp}
            >
              {loading 
                ? 'กำลังยืนยัน...' 
                : sendingOtp 
                ? 'กำลังส่ง OTP...' 
                : otpSent 
                ? 'ยืนยัน OTP' 
                : 'ส่ง OTP'}
            </Button>

            {otpSent && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setOtpSent(false);
                  form.setValue('otp', '');
                }}
              >
                เปลี่ยนเบอร์โทรศัพท์
              </Button>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}


