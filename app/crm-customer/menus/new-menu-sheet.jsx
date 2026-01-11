'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill } from '@remixicon/react';
import { Menu } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
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
import { menusApi } from '@/lib/api';

const FormSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อเมนู'),
  menu_key: z.string().min(1, 'กรุณากรอก Menu Key'),
  description: z.string().optional(),
});

export function NewMenuSheet({ open, onOpenChange, onSuccess }) {
  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      menu_key: '',
      description: '',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        name: '',
        menu_key: '',
        description: '',
      });
    }
  }, [open, form]);

  const onSubmit = async (data) => {
    try {
      await menusApi.create(data);
      toast.custom(
        (t) => (
          <Alert variant="mono" icon="primary" onClose={() => toast.dismiss(t)}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>เพิ่มเมนูสำเร็จ</AlertTitle>
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
      console.error('Failed to create menu:', error);
      toast.error(error.message || 'ไม่สามารถเพิ่มเมนูได้');
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
            <Menu className="text-primary size-4" />
            เพิ่มเมนู
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อเมนู *</FormLabel>
                      <FormControl>
                        <Input placeholder="กรุณากรอกชื่อเมนู" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="menu_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Menu Key *</FormLabel>
                      <FormControl>
                        <Input placeholder="กรุณากรอก Menu Key (เช่น: customers, promotions)" {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Menu Key ต้องเป็น unique และใช้สำหรับอ้างอิงเมนู
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รายละเอียด</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="กรุณากรอกรายละเอียด" 
                          {...field}
                          rows={4}
                        />
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
            <Button onClick={form.handleSubmit(onSubmit, onError)}>
              บันทึก
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}


