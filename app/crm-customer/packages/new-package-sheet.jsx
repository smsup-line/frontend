'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill } from '@remixicon/react';
import { Package } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { packagesApi, menusApi } from '@/lib/api';

const FormSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อแพ็คเกจ'),
  duration_days: z.number().int().min(1, 'กรุณากรอกระยะเวลาใช้งาน (ต้องมากกว่า 0)'),
  price: z.number().min(0, 'ราคาต้องมากกว่าหรือเท่ากับ 0').default(0),
  menu_ids: z.array(z.string()).default([]),
  select_all_menus: z.boolean().default(false),
});

export function NewPackageSheet({ open, onOpenChange, onSuccess }) {
  const [menus, setMenus] = useState([]);
  const [selectAllMenus, setSelectAllMenus] = useState(false);

  useEffect(() => {
    if (open) {
      loadMenus();
    }
  }, [open]);

  const loadMenus = async () => {
    try {
      const data = await menusApi.getAll();
      setMenus(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load menus:', error);
      toast.error('ไม่สามารถโหลดข้อมูลเมนูได้');
      setMenus([]);
    }
  };

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      duration_days: 30,
      price: 0,
      menu_ids: [],
      select_all_menus: false,
    },
    mode: 'onSubmit',
  });

  const watchedSelectAll = form.watch('select_all_menus');
  const watchedMenuIds = form.watch('menu_ids');

  useEffect(() => {
    if (watchedSelectAll) {
      setSelectAllMenus(true);
      form.setValue('menu_ids', []);
    } else {
      setSelectAllMenus(false);
    }
  }, [watchedSelectAll, form]);

  useEffect(() => {
    if (!open) {
      form.reset({
        name: '',
        duration_days: 30,
        price: 0,
        menu_ids: [],
        select_all_menus: false,
      });
      setSelectAllMenus(false);
    }
  }, [open, form]);

  const handleSelectAllChange = (checked) => {
    form.setValue('select_all_menus', checked);
    if (checked) {
      form.setValue('menu_ids', []);
    }
  };

  const handleMenuToggle = (menuId, checked) => {
    const currentMenuIds = form.getValues('menu_ids') || [];
    if (checked) {
      form.setValue('menu_ids', [...currentMenuIds, menuId]);
    } else {
      form.setValue('menu_ids', currentMenuIds.filter(id => id !== menuId));
      form.setValue('select_all_menus', false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const packageData = {
        name: data.name,
        duration_days: data.duration_days,
        price: data.price || 0,
        // ถ้า select_all_menus = true หรือ menu_ids เป็น empty array = ส่ง menu_ids เป็น []
        // ถ้า select_all_menus = false และ menu_ids มีค่า = ส่ง menu_ids ที่เลือก
        menu_ids: data.select_all_menus ? [] : (data.menu_ids || []),
      };

      await packagesApi.create(packageData);
      toast.custom(
        (t) => (
          <Alert variant="mono" icon="primary" onClose={() => toast.dismiss(t)}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>เพิ่มแพ็คเกจสำเร็จ</AlertTitle>
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
      console.error('Failed to create package:', error);
      toast.error(error.message || 'ไม่สามารถเพิ่มแพ็คเกจได้');
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
            <Package className="text-primary size-4" />
            เพิ่มแพ็คเกจ
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
                      <FormLabel>ชื่อแพ็คเกจ *</FormLabel>
                      <FormControl>
                        <Input placeholder="กรุณากรอกชื่อแพ็คเกจ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ระยะเวลาใช้งาน (วัน) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="30"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          value={field.value || 0}
                        />
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
                      <FormLabel>ราคาแพ็คเกจ *</FormLabel>
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
                      <p className="text-xs text-muted-foreground">
                        ใส่ 0 สำหรับแพ็คเกจ Free
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="select_all_menus"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              handleSelectAllChange(checked);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          เลือกเมนูทั้งหมด
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!selectAllMenus && (
                  <FormField
                    control={form.control}
                    name="menu_ids"
                    render={() => (
                      <FormItem>
                        <FormLabel>เลือกเมนูเฉพาะ</FormLabel>
                        <div className="space-y-2 border rounded-md p-4 max-h-[300px] overflow-y-auto">
                          {menus.length === 0 ? (
                            <p className="text-sm text-muted-foreground">ไม่มีเมนู</p>
                          ) : (
                            menus.map((menu) => (
                              <FormField
                                key={menu.id}
                                control={form.control}
                                name="menu_ids"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={menu.id}
                                      className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(menu.id)}
                                          onCheckedChange={(checked) => {
                                            handleMenuToggle(menu.id, checked);
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer">
                                        {menu.name} ({menu.menu_key || menu.menuKey || '-'})
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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


