'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill } from '@remixicon/react';
import { UserCog } from 'lucide-react';
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
import { adminApi, storeApi } from '@/lib/api';

const FormSchema = z.object({
  firstName: z.string().min(1, 'กรุณากรอกชื่อ'),
  lastName: z.string().min(1, 'กรุณากรอกนามสกุล'),
  username: z.string().min(1, 'กรุณากรอก username'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  role: z.enum(['superadmin', 'admin'], {
    required_error: 'กรุณาเลือกระดับผู้ดูแลระบบ',
  }),
  storeId: z.string().min(1, 'กรุณาเลือกร้านค้า'),
});

export function NewAdminSheet({ open, onOpenChange }) {
  const [stores, setStores] = useState([]);
  const [storeOpen, setStoreOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  const roles = [
    { value: 'superadmin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
  ];

  useEffect(() => {
    if (open) {
      loadStores();
    }
  }, [open]);

  const loadStores = async () => {
    try {
      const data = await storeApi.getAll();
      setStores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load stores:', error);
      toast.error('ไม่สามารถโหลดข้อมูลร้านค้าได้');
    }
  };

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      role: undefined,
      storeId: '',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (data) => {
    try {
      const adminData = {
        first_name: data.firstName,
        last_name: data.lastName,
        username: data.username,
        password: data.password,
        level: data.role,
        shop_id: data.storeId,
      };
      await adminApi.create(adminData);
      toast.custom(
        (t) => (
          <Alert variant="mono" icon="primary" onClose={() => toast.dismiss(t)}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>เพิ่มผู้ดูแลระบบสำเร็จ</AlertTitle>
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
      console.error('Failed to create admin:', error);
      toast.error(error.message || 'ไม่สามารถเพิ่มผู้ดูแลระบบได้');
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
            <UserCog className="text-primary size-4" />
            เพิ่มผู้ดูแลระบบ
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
                  name="firstName"
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
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>นามสกุล *</FormLabel>
                      <FormControl>
                        <Input placeholder="กรุณากรอกนามสกุล" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username *</FormLabel>
                      <FormControl>
                        <Input placeholder="กรุณากรอก username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="กรุณากรอกรหัสผ่าน"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ระดับผู้ดูแลระบบ *</FormLabel>
                      <FormControl>
                        <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              mode="input"
                              placeholder={!field.value}
                              aria-expanded={roleOpen}
                              className="w-full">
                              {field.value
                                ? roles.find((r) => r.value === field.value)?.label
                                : 'เลือกระดับผู้ดูแลระบบ...'}
                              <ButtonArrow />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="ค้นหาระดับ..." />
                              <CommandList>
                                <CommandEmpty>ไม่พบระดับ</CommandEmpty>
                                <CommandGroup>
                                  {roles.map((role) => (
                                    <CommandItem
                                      key={role.value}
                                      value={role.value}
                                      onSelect={(currentValue) => {
                                        field.onChange(currentValue);
                                        setRoleOpen(false);
                                      }}>
                                      {role.label}
                                      {field.value === role.value && <CommandCheck />}
                                    </CommandItem>
                                  ))}
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
                  name="storeId"
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

