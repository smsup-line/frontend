'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill } from '@remixicon/react';
import { GitBranch } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { branchApi } from '@/lib/api';

const FormSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อสาขา'),
  address: z.string().min(1, 'กรุณากรอกที่อยู่สาขา'),
  phone: z.string().optional(),
  description: z.string().optional(),
  storeId: z.string().min(1, 'กรุณาเลือกร้านค้า'),
});

export function EditBranchSheet({ open, onOpenChange, branch, stores, onSuccess }) {
  const [storeOpen, setStoreOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      description: '',
      storeId: '',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (branch && open) {
      form.reset({
        name: branch.name || '',
        address: branch.address || '',
        phone: branch.phone || '',
        description: branch.description || '',
        storeId: branch.shop_id || branch.storeId || '',
      });
    }
  }, [branch, open, form]);

  const onSubmit = async (data) => {
    if (!branch?.id) return;

    try {
      const branchData = {
        name: data.name,
        address: data.address,
        phone: data.phone || null,
        description: data.description || null,
        shop_id: data.storeId,
      };
      await branchApi.update(branch.id, branchData);
      toast.custom(
        (t) => (
          <Alert variant="mono" icon="primary" onClose={() => toast.dismiss(t)}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>แก้ไขสาขาสำเร็จ</AlertTitle>
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
      console.error('Failed to update branch:', error);
      toast.error(error.message || 'ไม่สามารถแก้ไขสาขาได้');
    }
  };

  const onError = (errors) => {
    console.log('Form validation errors:', errors);
    toast.error('กรุณาตรวจสอบข้อมูลที่กรอก');
  };

  if (!branch) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:w-[600px] sm:max-w-none inset-5 start-auto h-auto rounded-lg p-0 [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="border-b py-3.5 px-5 border-border">
          <SheetTitle className="flex items-center gap-2.5">
            <GitBranch className="text-primary size-4" />
            แก้ไขสาขา
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
                      <FormLabel>ชื่อสาขา *</FormLabel>
                      <FormControl>
                        <Input placeholder="กรุณากรอกชื่อสาขา" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ที่อยู่สาขา *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="กรุณากรอกที่อยู่สาขา"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เบอร์โทรศัพท์</FormLabel>
                      <FormControl>
                        <Input placeholder="กรุณากรอกเบอร์โทรศัพท์" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รายละเอียดเพิ่มเติม</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="กรุณากรอกรายละเอียดเพิ่มเติม"
                          {...field}
                        />
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

