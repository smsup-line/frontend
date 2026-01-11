'use client';

import { useState, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill } from '@remixicon/react';
import { Gift, Upload, X } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { SimpleTextEditor } from '@/components/ui/simple-text-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { promotionsApi, storeApi, branchApi } from '@/lib/api';
import { uploadToCloudinary, getImagePreview, revokeImagePreview } from '@/lib/cloudinary';

const createFormSchema = (userRole, userStoreId) => z.object({
  shop_id: z.string().optional().superRefine((val, ctx) => {
    if (userRole !== 'superadmin' && userStoreId) {
      return;
    }
    if (!val || val.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'กรุณาเลือกร้านค้า',
      });
    }
  }),
  name: z.string().min(1, 'กรุณากรอกชื่อโปรโมชั่น'),
  image_url: z.string().optional(),
  points: z.number().int().min(1, 'กรุณากรอกคะแนนสะสม'),
  description: z.string().optional(),
  branches: z.array(z.string()).default([]),
  status: z.enum(['open', 'close']).default('close'),
});

export function EditPromotionSheet({ open, onOpenChange, promotion, stores: storesProp, branches: branchesProp, onSuccess }) {
  const [stores, setStores] = useState(storesProp || []);
  const [branches, setBranches] = useState(branchesProp || []);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userStoreId, setUserStoreId] = useState(null);

  useEffect(() => {
    if (open) {
      loadUserInfo();
      if (!storesProp || storesProp.length === 0) {
        loadStores();
      }
      if (promotion) {
        const shopId = promotion.shop_id || promotion.shopID;
        if (shopId) {
          loadBranches(shopId);
        }
      }
    }
  }, [open, storesProp, promotion]);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserRole(user.role);
          setUserStoreId(user.shop_id || user.storeId);
        } catch (e) {
          console.error('Failed to parse user info:', e);
        }
      }
    }
  };

  const loadStores = async () => {
    try {
      const data = await storeApi.getAll();
      setStores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load stores:', error);
    }
  };

  const loadBranches = async (storeId) => {
    if (!storeId) {
      setBranches([]);
      return;
    }
    try {
      const data = await branchApi.getAll({ storeId });
      setBranches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load branches:', error);
      setBranches([]);
    }
  };

  const resolver = useMemo(
    () => zodResolver(createFormSchema(userRole, userStoreId)),
    [userRole, userStoreId]
  );

  const form = useForm({
    resolver,
    defaultValues: {
      shop_id: userStoreId || '',
      name: '',
      image_url: '',
      points: 0,
      description: '',
      branches: [],
      status: 'close',
    },
    mode: 'onSubmit',
  });

  const watchedStoreId = form.watch('shop_id');

  useEffect(() => {
    if (watchedStoreId) {
      loadBranches(watchedStoreId);
    }
  }, [watchedStoreId]);

  useEffect(() => {
    if (promotion && open) {
      const shopId = userRole !== 'superadmin' && userStoreId 
        ? userStoreId 
        : (promotion.shop_id || promotion.shopID || '');
      
      // Convert branchIds to array of string IDs
      const branchIdsRaw = promotion.branches || promotion.branch_ids || [];
      let branchIds = [];
      
      if (Array.isArray(branchIdsRaw)) {
        branchIds = branchIdsRaw.map(branch => {
          // If branch is an object, extract the id
          if (typeof branch === 'object' && branch !== null && branch.id) {
            return branch.id;
          }
          // If branch is already a string, use it directly
          return String(branch);
        });
      }
      
      // Reset form with all values
      form.reset({
        shop_id: shopId,
        name: promotion.name || '',
        image_url: promotion.image_url || promotion.imageURL || '',
        points: promotion.points || 0,
        description: promotion.description || '',
        branches: branchIds,
        status: promotion.status || 'close',
      });

      if (promotion.image_url || promotion.imageURL) {
        setImagePreview(promotion.image_url || promotion.imageURL);
      }
    }
  }, [promotion, open, form, userRole, userStoreId]);

  // Update branches field after branches are loaded
  useEffect(() => {
    if (promotion && open && branches.length > 0) {
      const branchIdsRaw = promotion.branches || promotion.branch_ids || [];
      let branchIds = [];
      
      if (Array.isArray(branchIdsRaw)) {
        branchIds = branchIdsRaw.map(branch => {
          // If branch is an object, extract the id
          if (typeof branch === 'object' && branch !== null && branch.id) {
            return branch.id;
          }
          // If branch is already a string, use it directly
          return String(branch);
        });
      }
      
      // Only update branches field if it's different
      const currentBranches = form.getValues('branches') || [];
      if (JSON.stringify(currentBranches.sort()) !== JSON.stringify(branchIds.sort())) {
        form.setValue('branches', branchIds, { shouldValidate: false });
      }
    }
  }, [promotion, open, branches, form]);

  useEffect(() => {
    if (open && userStoreId && userRole !== 'superadmin' && promotion) {
      form.setValue('shop_id', userStoreId, { shouldValidate: true });
    }
  }, [open, userStoreId, userRole, promotion, form]);

  const handleImageChange = (e) => {
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
      setImageFile(file);
      const preview = getImagePreview(file);
      if (imagePreview && !promotion?.image_url) {
        revokeImagePreview(imagePreview);
      }
      setImagePreview(preview);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview && !promotion?.image_url) {
      revokeImagePreview(imagePreview);
    }
    setImagePreview(null);
    form.setValue('image_url', '');
  };

  const onSubmit = async (data) => {
    if (!promotion?.id) return;

    try {
      const finalShopId = data.shop_id || userStoreId;
      if (!finalShopId) {
        toast.error('ไม่พบรหัสร้านค้า');
        return;
      }

      if (!data.shop_id && userStoreId && userRole !== 'superadmin') {
        form.setValue('shop_id', userStoreId, { shouldValidate: true });
        const isValid = await form.trigger('shop_id');
        if (!isValid) {
          return;
        }
      }

      setUploading(true);
      let imageUrl = data.image_url;

      if (imageFile) {
        try {
          imageUrl = await uploadToCloudinary(imageFile);
          form.setValue('image_url', imageUrl);
        } catch (error) {
          console.error('Upload error:', error);
          toast.error('ไม่สามารถอัพโหลดรูปภาพได้');
          return;
        }
      }

      const updateData = {
        name: data.name,
        image_url: imageUrl || null,
        points: data.points,
        description: data.description || null,
        shop_id: finalShopId,
        branch_ids: data.branches || [],
        status: data.status || 'close',
      };

      await promotionsApi.update(promotion.id, updateData);
      toast.custom(
        (t) => (
          <Alert variant="mono" icon="primary" onClose={() => toast.dismiss(t)}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>แก้ไขโปรโมชั่นสำเร็จ</AlertTitle>
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
      console.error('Failed to update promotion:', error);
      toast.error(error.message || 'ไม่สามารถแก้ไขโปรโมชั่นได้');
    } finally {
      setUploading(false);
    }
  };

  const onError = (errors) => {
    console.log('Form validation errors:', errors);
    toast.error('กรุณาตรวจสอบข้อมูลที่กรอก');
  };

  if (!promotion) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:w-[600px] sm:max-w-none inset-5 start-auto h-auto rounded-lg p-0 [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="border-b py-3.5 px-5 border-border">
          <SheetTitle className="flex items-center gap-2.5">
            <Gift className="text-primary size-4" />
            แก้ไขโปรโมชั่น
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
                              disabled={userRole !== 'superadmin'}
                              className="w-full">
                              {field.value
                                ? stores.find((s) => s.id === field.value)?.name
                                : 'เลือกร้านค้า...'}
                              {userRole === 'superadmin' && <ButtonArrow />}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="ค้นหาร้านค้า..." />
                              <CommandList>
                                <CommandEmpty>
                                  {stores.length === 0 ? 'กำลังโหลดร้านค้า...' : 'ไม่พบร้านค้า'}
                                </CommandEmpty>
                                <CommandGroup>
                                  <ScrollArea className="h-[200px]">
                                    {stores.length > 0 ? (
                                      stores.map((store) => (
                                        <CommandItem
                                          key={store.id}
                                          value={store.id}
                                          onSelect={(currentValue) => {
                                            if (userRole === 'superadmin') {
                                              field.onChange(currentValue);
                                              setStoreOpen(false);
                                            }
                                          }}
                                          disabled={userRole !== 'superadmin'}>
                                          {store.name}
                                          {field.value === store.id && <CommandCheck />}
                                        </CommandItem>
                                      ))
                                    ) : (
                                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                        กำลังโหลดร้านค้า...
                                      </div>
                                    )}
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

                <div className="space-y-2">
                  <Label>รูปภาพโปรโมชั่น</Label>
                  <div className="flex items-center gap-4">
                    {imagePreview ? (
                      <div className="relative">
                        <Avatar className="size-24">
                          <AvatarImage src={imagePreview} alt="Promotion preview" />
                          <AvatarFallback>IMG</AvatarFallback>
                        </Avatar>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={removeImage}>
                          <X className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="promotion-image-upload-edit"
                        />
                        <Label htmlFor="promotion-image-upload-edit" className="cursor-pointer">
                          <Button type="button" variant="outline" size="sm" asChild>
                            <span>
                              <Upload className="size-4 mr-2" />
                              อัพโหลดรูปภาพ
                            </span>
                          </Button>
                        </Label>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    รองรับไฟล์รูปภาพขนาดไม่เกิน 5MB
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อโปรโมชั่น *</FormLabel>
                      <FormControl>
                        <Input placeholder="กรุณากรอกชื่อโปรโมชั่น" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>แลกคะแนนสะสม *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รายละเอียด</FormLabel>
                      <FormControl>
                        <SimpleTextEditor
                          value={field.value || ''}
                          onChange={(html) => field.onChange(html)}
                          placeholder="กรุณากรอกรายละเอียดโปรโมชั่น"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        หมายเหตุ: ไม่สามารถอัพโหลดรูปภาพในรายละเอียดได้
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedStoreId && (
                  <FormField
                    control={form.control}
                    name="branches"
                    render={() => (
                      <FormItem>
                        <FormLabel>สาขาที่ร่วมโปรโมชั่น</FormLabel>
                        <div className="space-y-2 border rounded-md p-4 max-h-[200px] overflow-y-auto">
                          {branches.length === 0 ? (
                            <p className="text-sm text-muted-foreground">ไม่มีสาขา</p>
                          ) : (
                            branches.map((branch) => (
                              <FormField
                                key={branch.id}
                                control={form.control}
                                name="branches"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={branch.id}
                                      className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(branch.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, branch.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== branch.id
                                                  )
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer">
                                        {branch.name}
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

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          สถานะ
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          เปิด/ปิด
                        </div>
                      </div>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">เปิด</SelectItem>
                            <SelectItem value="close">ปิด</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
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
            <Button onClick={form.handleSubmit(onSubmit, onError)} disabled={uploading}>
              {uploading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

