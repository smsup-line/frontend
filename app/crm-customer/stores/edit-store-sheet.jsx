'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill } from '@remixicon/react';
import { Store, Upload, X } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { storeApi, packagesApi } from '@/lib/api';
import { uploadToCloudinary, getImagePreview, revokeImagePreview } from '@/lib/cloudinary';
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
import { ButtonArrow } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FormSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อร้านค้า'),
  address: z.string().min(1, 'กรุณากรอกที่อยู่ร้านค้า'),
  phone: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  package_id: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.string().optional(),
});

export function EditStoreSheet({ open, onOpenChange, store, onSuccess }) {
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [packages, setPackages] = useState([]);
  const [packageOpen, setPackageOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      description: '',
      logo: '',
      package_id: '',
      start_date: '',
      end_date: '',
      status: '',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (open) {
      loadPackages();
    }
  }, [open]);

  const loadPackages = async () => {
    try {
      const data = await packagesApi.getAll();
      setPackages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load packages:', error);
    }
  };

  useEffect(() => {
    if (store && open) {
      const startDate = store.start_date || store.startDate || '';
      const endDate = store.end_date || store.endDate || '';
      form.reset({
        name: store.name || '',
        address: store.address || '',
        phone: store.phone || '',
        description: store.description || '',
        logo: store.logo_url || store.logo || '',
        package_id: store.package_id || store.packageId || '',
        start_date: startDate ? (startDate.includes('T') ? startDate.split('T')[0] : startDate) : '',
        end_date: endDate ? (endDate.includes('T') ? endDate.split('T')[0] : endDate) : '',
        status: store.status || '',
      });
      const logoUrl = store.logo_url || store.logo || '';
      if (logoUrl) {
        setLogoPreview(logoUrl);
      }
    }
  }, [store, open, form]);

  useEffect(() => {
    if (!open) {
      setLogoFile(null);
      if (logoPreview && !store?.logo) {
        revokeImagePreview(logoPreview);
      }
      setLogoPreview(store?.logo || null);
    }
  }, [open, store]);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('กรุณาเลือกไฟล์รูปภาพ');
        return;
      }
      setLogoFile(file);
      const preview = getImagePreview(file);
      if (logoPreview && !store?.logo) {
        revokeImagePreview(logoPreview);
      }
      setLogoPreview(preview);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    if (logoPreview && !store?.logo) {
      revokeImagePreview(logoPreview);
    }
    setLogoPreview(null);
    form.setValue('logo', '');
  };

  const onSubmit = async (data) => {
    if (!store?.id) return;

    try {
      setUploading(true);
      let logoUrl = data.logo;

      // Upload logo if new file is selected
      if (logoFile) {
        try {
          logoUrl = await uploadToCloudinary(logoFile);
          form.setValue('logo', logoUrl);
        } catch (error) {
          console.error('Upload error:', error);
          toast.error('ไม่สามารถอัพโหลดรูปภาพได้');
          return;
        }
      }

      // Convert date strings to ISO 8601 format
      let startDateISO = null;
      let endDateISO = null;
      
      if (data.start_date) {
        const startDate = new Date(data.start_date);
        startDate.setHours(0, 0, 0, 0);
        startDateISO = startDate.toISOString();
      }
      
      if (data.end_date) {
        const endDate = new Date(data.end_date);
        endDate.setHours(23, 59, 59, 999);
        endDateISO = endDate.toISOString();
      }

      const storeData = {
        name: data.name,
        address: data.address,
        phone: data.phone || null,
        description: data.description || null,
        logo_url: logoUrl || store?.logo || null,
        package_id: data.package_id || null,
        start_date: startDateISO,
        end_date: endDateISO,
        status: data.status || null,
      };

      await storeApi.update(store.id, storeData);
      toast.custom(
        (t) => (
          <Alert variant="mono" icon="primary" onClose={() => toast.dismiss(t)}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>แก้ไขร้านค้าสำเร็จ</AlertTitle>
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
      console.error('Failed to update store:', error);
      toast.error(error.message || 'ไม่สามารถแก้ไขร้านค้าได้');
    } finally {
      setUploading(false);
    }
  };

  const onError = (errors) => {
    console.log('Form validation errors:', errors);
    toast.error('กรุณาตรวจสอบข้อมูลที่กรอก');
  };

  if (!store) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:w-[600px] sm:max-w-none inset-5 start-auto h-auto rounded-lg p-0 [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="border-b py-3.5 px-5 border-border">
          <SheetTitle className="flex items-center gap-2.5">
            <Store className="text-primary size-4" />
            แก้ไขร้านค้า
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
                      <FormLabel>ชื่อร้านค้า *</FormLabel>
                      <FormControl>
                        <Input placeholder="กรุณากรอกชื่อร้านค้า" {...field} />
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
                      <FormLabel>ที่อยู่ร้านค้า *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="กรุณากรอกที่อยู่ร้านค้า"
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

                <div className="space-y-2">
                  <Label>รูปภาพโลโก้</Label>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <div className="relative">
                        <Avatar className="size-20">
                          <AvatarImage src={logoPreview} alt="Logo preview" />
                          <AvatarFallback>LOGO</AvatarFallback>
                        </Avatar>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={removeLogo}>
                          <X className="size-4" />
                        </Button>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                        id="logo-upload-edit"
                      />
                      <Label
                        htmlFor="logo-upload-edit"
                        className="cursor-pointer">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          asChild>
                          <span>
                            <Upload className="size-4 mr-2" />
                            {logoPreview ? 'เปลี่ยนโลโก้' : 'อัพโหลดโลโก้'}
                          </span>
                        </Button>
                      </Label>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    รองรับไฟล์รูปภาพขนาดไม่เกิน 5MB
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="package_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>แพ็คเกจ</FormLabel>
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
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>วันเริ่มต้น</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>วันสิ้นสุด</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>สถานะ</FormLabel>
                      <FormControl>
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกสถานะ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">เปิด</SelectItem>
                            <SelectItem value="close">ปิด</SelectItem>
                          </SelectContent>
                        </Select>
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
            <Button
              onClick={form.handleSubmit(onSubmit, onError)}
              disabled={uploading}>
              {uploading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

