'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { customerPhoneApi, checkOtpApi } from '@/lib/api';

const PhoneFormSchema = z.object({
  phone: z.string().length(10, 'เบอร์โทรศัพท์ต้องมี 10 ตัวเลข').regex(/^[0-9]+$/, 'เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น'),
});

const OtpFormSchema = z.object({
  otp: z.string().length(5, 'OTP ต้องมี 5 ตัวเลข').regex(/^[0-9]+$/, 'OTP ต้องเป็นตัวเลขเท่านั้น'),
});

export default function VerifyPhonePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  const phoneForm = useForm({
    resolver: zodResolver(PhoneFormSchema),
    defaultValues: {
      phone: '',
    },
    mode: 'onSubmit',
  });

  const otpForm = useForm({
    resolver: zodResolver(OtpFormSchema),
    defaultValues: {
      otp: '',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    // Get phone from query parameter
    const phoneParam = searchParams.get('phone');
    if (phoneParam) {
      phoneForm.setValue('phone', phoneParam);
    }

    // Get customer ID from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.id) {
          setCustomerId(user.id);
        }
        // If phone is in user data and not in query, use it
        if (!phoneParam && user.phone) {
          phoneForm.setValue('phone', user.phone);
        }
      } catch (e) {
        console.error('Failed to parse user info:', e);
      }
    }
  }, [searchParams, phoneForm]);

  const handlePhoneSubmit = async (data) => {
    if (!customerId) {
      toast.error('ไม่พบข้อมูลลูกค้า');
      return;
    }

    try {
      setLoading(true);
      
      // Call PUT /api/customer-phone
      console.log('Updating customer phone:', { customer_id: customerId, phone: data.phone });
      await customerPhoneApi.update({
        customer_id: customerId,
        phone: data.phone,
      });

      // Store phone number for OTP step
      setPhoneNumber(data.phone);
      setPhoneSubmitted(true);
      toast.success('บันทึกเบอร์โทรศัพท์สำเร็จ กรุณากรอก OTP');
    } catch (error) {
      console.error('Update phone error:', error);
      const errorMessage = error.message || error.data?.message || 'ไม่สามารถบันทึกเบอร์โทรศัพท์ได้';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (data) => {
    if (!customerId) {
      toast.error('ไม่พบข้อมูลลูกค้า');
      return;
    }

    try {
      setLoading(true);

      // Call POST /api/check-otp
      console.log('Checking OTP for customer:', customerId, 'OTP:', data.otp);
      const checkResult = await checkOtpApi.check({
        customer_id: customerId,
        otp: data.otp,
      });

      console.log('OTP check result:', checkResult);

      if (checkResult.otp_verified === true) {
        // OTP verified successfully
        // Update user in localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            user.phone = phoneNumber;
            user.otp_verify = true;
            localStorage.setItem('user', JSON.stringify(user));
          } catch (e) {
            console.error('Failed to update user in localStorage:', e);
          }
        }

        toast.success('ยืนยัน OTP สำเร็จ');
        router.push('/crm-customer/profile');
      } else {
        toast.error('รหัส OTP ไม่ถูกต้อง');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      const errorMessage = error.message || error.data?.message || 'ไม่สามารถยืนยัน OTP ได้';
      
      // Check if error is about invalid OTP
      if (errorMessage.includes('invalid OTP') || errorMessage.includes('OTP')) {
        toast.error('รหัส OTP ไม่ถูกต้อง');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneError = (errors) => {
    console.log('Phone form validation errors:', errors);
    toast.error('กรุณาตรวจสอบข้อมูลที่กรอก');
  };

  const handleOtpError = (errors) => {
    console.log('OTP form validation errors:', errors);
    toast.error('กรุณาตรวจสอบข้อมูลที่กรอก');
  };

  const handleChangePhone = () => {
    setPhoneSubmitted(false);
    otpForm.reset();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-border bg-card p-8 shadow-lg mx-auto">
        <div className="flex flex-col items-center space-y-2">
          <div className="rounded-full bg-primary/10 p-3">
            {phoneSubmitted ? (
              <Shield className="size-8 text-primary" />
            ) : (
              <Phone className="size-8 text-primary" />
            )}
          </div>
          <h1 className="text-2xl font-bold">
            {phoneSubmitted ? 'ยืนยัน OTP' : 'กรอกเบอร์โทรศัพท์'}
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            {phoneSubmitted 
              ? 'กรุณากรอก OTP 5 ตัวเลขที่ส่งไปยังเบอร์โทรศัพท์ของคุณ'
              : 'กรุณากรอกเบอร์โทรศัพท์ 10 ตัวเลขเพื่อยืนยันตัวตน'}
          </p>
        </div>

        {!phoneSubmitted ? (
          // Step 1: Phone number form
          <Form {...phoneForm}>
            <form
              onSubmit={phoneForm.handleSubmit(handlePhoneSubmit, handlePhoneError)}
              className="space-y-6">
              <FormField
                control={phoneForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เบอร์โทรศัพท์ (10 ตัวเลข) *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="กรุณากรอกเบอร์โทรศัพท์ 10 ตัวเลข"
                        {...field}
                        disabled={loading}
                        type="tel"
                        maxLength={10}
                        inputMode="numeric"
                        onChange={(e) => {
                          // Only allow numbers
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกเบอร์โทรศัพท์'}
              </Button>
            </form>
          </Form>
        ) : (
          // Step 2: OTP form
          <Form {...otpForm}>
            <form
              onSubmit={otpForm.handleSubmit(handleOtpSubmit, handleOtpError)}
              className="space-y-6">
              <div className="text-sm text-muted-foreground text-center">
                เบอร์โทรศัพท์: {phoneNumber}
              </div>

              <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OTP (5 ตัวเลข) *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="กรุณากรอก OTP 5 ตัวเลข"
                        {...field}
                        disabled={loading}
                        maxLength={5}
                        type="tel"
                        inputMode="numeric"
                        onChange={(e) => {
                          // Only allow numbers
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'กำลังตรวจสอบ...' : 'ยืนยัน OTP'}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleChangePhone}
                disabled={loading}
              >
                เปลี่ยนเบอร์โทรศัพท์
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
