'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill } from '@remixicon/react';
import { History } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { packageRenewalHistoryApi, storeApi, packagesApi } from '@/lib/api';

const FormSchema = z.object({
  shop_id: z.string().min(1, 'กรุณาเลือกร้านค้า'),
  package_id: z.string().min(1, 'กรุณาเลือกแพ็คเกจ'),
  price: z.number().min(0, 'ราคาต้องมากกว่าหรือเท่ากับ 0').default(0),
});

export function EditPackageRenewalHistorySheet({ open, onOpenChange, history, onSuccess }) {
  const [stores, setStores] = useState([]);
  const [packages, setPackages] = useState([]);
  const [storeOpen, setStoreOpen] = useState(false);
  const [packageOpen, setPackageOpen] = useState(false);

  useEffect(() => {
    if (open) {
      loadStores();
      loadPackages();
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

  const loadPackages = async () => {
    try {
      const data = await packagesApi.getAll();
      setPackages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load packages:', error);
      toast.error('ไม่สามารถโหลดข้อมูลแพ็คเกจได้');
    }
  };

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      shop_id: '',
      package_id: '',
      price: 0,
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (history && open) {
      form.reset({
        shop_id: history.shop_id || history.shopId || '',
        package_id: history.package_id || history.packageId || '',
        price: history.price || 0,
      });
    }
  }, [history, open, form]);

  const onSubmit = async (data) => {
    if (!history?.id) return;

    try {
      const updateData = {
        shop_id: data.shop_id,
        package_id: data.package_id,
        price: data.price || 0,
      };

      await packageRenewalHistoryApi.update(history.id, updateData);
      toast.custom(
        (t) => (
          <Alert variant="mono" icon="primary" onClose={() => toast.dismiss(t)}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>แก้ไขประวัติการต่ออายุสำเร็จ</AlertTitle>
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
      console.error('Failed to update package renewal history:', error);
      toast.error(error.message || 'ไม่สามารถแก้ไขประวัติการต่ออายุได้');
    }
  };

  const onError = (errors) => {
    console.log('Form validation errors:', errors);
    toast.error('กรุณาตรวจสอบข้อมูลที่กรอก');
  };

  if (!history) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:w-[600px] sm:max-w-none inset-5 start-auto h-auto rounded-lg p-0 [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="border-b py-3.5 px-5 border-border">
          <SheetTitle className="flex items-center gap-2.5">
            <History className="text-primary size-4" />
            แก้ไขประวัติการต่ออายุแพ็คเกจ
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

                <FormField
                  control={form.control}
                  name="package_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>แพ็คเกจ *</FormLabel>
                      <FormControl>
                        <Popover open={packageOpen} onOpenChange={setPackageOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              mode="input"
                              placeholder={!field.value}
                              aria-expanded={packageOpen}
                              className="w-full">
                              {field.value
                                ? packages.find((p) => p.id === field.value)?.name
                                : 'เลือกแพ็คเกจ...'}
                              <ButtonArrow />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="ค้นหาแพ็คเกจ..." />
                              <CommandList>
                                <CommandEmpty>ไม่พบแพ็คเกจ</CommandEmpty>
                                <CommandGroup>
                                  <ScrollArea className="h-[200px]">
                                    {packages.map((pkg) => (
                                      <CommandItem
                                        key={pkg.id}
                                        value={pkg.id}
                                        onSelect={(currentValue) => {
                                          field.onChange(currentValue);
                                          setPackageOpen(false);
                                        }}>
                                        {pkg.name}
                                        {field.value === pkg.id && <CommandCheck />}
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

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ราคา *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          value={field.value ?? 0}
                          min="0"
                          step="0.01"
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


