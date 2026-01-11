'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill } from '@remixicon/react';
import { Users, Upload, X } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { customerApi, branchApi, customFieldsApi, customerCustomValuesApi } from '@/lib/api';
import { uploadToCloudinary, getImagePreview, revokeImagePreview } from '@/lib/cloudinary';

const FormSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อ'),
  avatar: z.string().optional(),
  phone: z.string().min(1, 'กรุณากรอกเบอร์โทรศัพท์'),
  otpVerify: z.string().optional(),
  lineToken: z.string().optional(),
  role: z.enum(['adminshop', 'customer'], {
    required_error: 'กรุณาเลือก Role',
  }),
  branchId: z.string().optional(),
});

export function EditCustomerSheet({ open, onOpenChange, customer, onSuccess }) {
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [branchOpen, setBranchOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [customFields, setCustomFields] = useState([]);
  const [customValues, setCustomValues] = useState({});

  const roles = [
    { value: 'adminshop', label: 'Staff ของร้าน' },
    { value: 'customer', label: 'ลูกค้าร้าน' },
  ];

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      avatar: '',
      phone: '',
      otpVerify: '',
      lineToken: '',
      role: undefined,
      branchId: '',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (customer && open) {
      const avatarUrl = customer.avatar_url || customer.avatar || '';
      const storeId = customer.shop_id || customer.storeId || '';
      const branchId = customer.branch_id || customer.branchId || '';
      
      form.reset({
        name: customer.name || '',
        avatar: avatarUrl,
        phone: customer.phone || '',
        otpVerify: customer.otp_verify || customer.otpVerify || '',
        lineToken: customer.line_token || customer.lineToken || '',
        role: customer.role || undefined,
        storeId: storeId,
        branchId: branchId,
      });
      if (avatarUrl) {
        setAvatarPreview(avatarUrl);
      }
      if (customer.role === 'adminshop' && storeId) {
        loadBranches(storeId);
      }
      if (storeId) {
        loadCustomFields(storeId);
        loadCustomerCustomValues(customer.id);
      }
    }
  }, [customer, open, form]);

  useEffect(() => {
    if (!open) {
      setAvatarFile(null);
      if (avatarPreview && !customer?.avatar) {
        revokeImagePreview(avatarPreview);
      }
      setAvatarPreview(customer?.avatar || null);
    }
  }, [open, customer]);

  const loadBranches = async (storeId) => {
    if (!storeId) return;
    try {
      const data = await branchApi.getAll({ storeId });
      setBranches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load branches:', error);
      setBranches([]);
    }
  };

  const loadCustomFields = async (shopId) => {
    if (!shopId) return;
    try {
      const data = await customFieldsApi.getAll({ shop_id: shopId });
      const enabledFields = Array.isArray(data) 
        ? data.filter(field => field.is_enabled !== false && field.is_visible !== false)
        : [];
      enabledFields.sort((a, b) => (a.field_order || 0) - (b.field_order || 0));
      setCustomFields(enabledFields);
    } catch (error) {
      console.error('Failed to load custom fields:', error);
      setCustomFields([]);
    }
  };

  const loadCustomerCustomValues = async (customerId) => {
    if (!customerId) return;
    try {
      const data = await customerCustomValuesApi.getAll(customerId);
      const valuesMap = {};
      if (Array.isArray(data)) {
        data.forEach(item => {
          valuesMap[item.field_id] = item.value;
        });
      }
      setCustomValues(valuesMap);
    } catch (error) {
      console.error('Failed to load customer custom values:', error);
      setCustomValues({});
    }
  };

  const handleAvatarChange = (e) => {
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
      setAvatarFile(file);
      const preview = getImagePreview(file);
      if (avatarPreview && !customer?.avatar) {
        revokeImagePreview(avatarPreview);
      }
      setAvatarPreview(preview);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    if (avatarPreview && !customer?.avatar) {
      revokeImagePreview(avatarPreview);
    }
    setAvatarPreview(null);
    form.setValue('avatar', '');
  };

  const onSubmit = async (data) => {
    if (!customer?.id) return;

    try {
      setUploading(true);
      let avatarUrl = data.avatar;

      // Upload avatar if new file is selected
      if (avatarFile) {
        try {
          avatarUrl = await uploadToCloudinary(avatarFile);
          form.setValue('avatar', avatarUrl);
        } catch (error) {
          console.error('Upload error:', error);
          toast.error('ไม่สามารถอัพโหลดรูปภาพได้');
          return;
        }
      }

      const customerData = {
        name: data.name,
        avatar_url: avatarUrl || customer.avatar || null,
        phone: data.phone,
        otp_verify: data.otpVerify ? true : false,
        line_token: data.lineToken || null,
        role: data.role,
        shop_id: data.storeId || customer.shopId || null,
        branch_id: data.branchId || customer.branchId || null,
        last_checkin_at: customer.lastCheckinAt || null,
      };

      await customerApi.update(customer.id, customerData);

      // Update custom values
      if (Object.keys(customValues).length > 0) {
        try {
          for (const [fieldId, value] of Object.entries(customValues)) {
            if (value !== null && value !== undefined && value !== '') {
              await customerCustomValuesApi.createOrUpdate(customer.id, {
                field_id: fieldId,
                value: String(value),
              });
            }
          }
        } catch (error) {
          console.error('Failed to update custom values:', error);
          // Don't fail the whole operation if custom values fail
        }
      }

      toast.custom(
        (t) => (
          <Alert variant="mono" icon="primary" onClose={() => toast.dismiss(t)}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>แก้ไขลูกค้าสำเร็จ</AlertTitle>
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
      console.error('Failed to update customer:', error);
      toast.error(error.message || 'ไม่สามารถแก้ไขลูกค้าได้');
    } finally {
      setUploading(false);
    }
  };

  const onError = (errors) => {
    console.log('Form validation errors:', errors);
    toast.error('กรุณาตรวจสอบข้อมูลที่กรอก');
  };

  if (!customer) return null;

  const watchedRole = form.watch('role');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:w-[600px] sm:max-w-none inset-5 start-auto h-auto rounded-lg p-0 [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="border-b py-3.5 px-5 border-border">
          <SheetTitle className="flex items-center gap-2.5">
            <Users className="text-primary size-4" />
            แก้ไขลูกค้า
          </SheetTitle>
        </SheetHeader>
        <SheetBody className="p-0">
          <ScrollArea className="h-[calc(100dvh-11.75rem)] ps-3 pe-2 me-1">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, onError)}
                className="space-y-6 px-2">
                <div className="space-y-2">
                  <Label>รูป Avatar</Label>
                  <div className="flex items-center gap-4">
                    {avatarPreview ? (
                      <div className="relative">
                        <Avatar className="size-20">
                          <AvatarImage src={avatarPreview} alt="Avatar preview" />
                          <AvatarFallback>AV</AvatarFallback>
                        </Avatar>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={removeAvatar}>
                          <X className="size-4" />
                        </Button>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                        id="avatar-upload-edit"
                      />
                      <Label htmlFor="avatar-upload-edit" className="cursor-pointer">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="size-4 mr-2" />
                            {avatarPreview ? 'เปลี่ยน Avatar' : 'อัพโหลด Avatar'}
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
                  name="name"
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เบอร์โทรศัพท์ *</FormLabel>
                      <FormControl>
                        <Input placeholder="กรุณากรอกเบอร์โทรศัพท์" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="otpVerify"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OTP Verify</FormLabel>
                      <FormControl>
                        <Input placeholder="กรุณากรอก OTP Verify" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lineToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Line Token</FormLabel>
                      <FormControl>
                        <Input placeholder="กรุณากรอก Line Token" {...field} />
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
                      <FormLabel>Role *</FormLabel>
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
                                : 'เลือก Role...'}
                              <ButtonArrow />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="ค้นหา Role..." />
                              <CommandList>
                                <CommandEmpty>ไม่พบ Role</CommandEmpty>
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

                {watchedRole === 'adminshop' && (customer.shop_id || customer.storeId) && (
                  <FormField
                    control={form.control}
                    name="branchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>รหัสสาขา</FormLabel>
                        <FormControl>
                          <Popover open={branchOpen} onOpenChange={setBranchOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                mode="input"
                                placeholder={!field.value}
                                aria-expanded={branchOpen}
                                className="w-full">
                                {field.value
                                  ? branches.find((b) => b.id === field.value)?.name
                                  : 'เลือกสาขา...'}
                                <ButtonArrow />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="ค้นหาสาขา..." />
                                <CommandList>
                                  <CommandEmpty>ไม่พบสาขา</CommandEmpty>
                                  <CommandGroup>
                                    <ScrollArea className="h-[200px]">
                                      {branches.map((branch) => (
                                        <CommandItem
                                          key={branch.id}
                                          value={branch.id}
                                          onSelect={(currentValue) => {
                                            field.onChange(currentValue);
                                            setBranchOpen(false);
                                          }}>
                                          {branch.name}
                                          {field.value === branch.id && <CommandCheck />}
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
                )}

                {/* Custom Fields */}
                {customFields.length > 0 && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium">Custom Fields</h3>
                    {customFields.map((field) => {
                      const fieldId = field.id;
                      const fieldValue = customValues[fieldId] || '';
                      
                      return (
                        <div key={fieldId} className="space-y-2">
                          <Label>
                            {field.name}
                            {field.is_required && <span className="text-destructive ml-1">*</span>}
                          </Label>
                          {field.description && (
                            <p className="text-xs text-muted-foreground">{field.description}</p>
                          )}
                          
                          {field.field_type === 'text' && (
                            <Input
                              value={fieldValue}
                              onChange={(e) => {
                                setCustomValues(prev => ({
                                  ...prev,
                                  [fieldId]: e.target.value,
                                }));
                              }}
                              placeholder={`กรุณากรอก${field.name}`}
                            />
                          )}
                          
                          {field.field_type === 'number' && (
                            <Input
                              type="number"
                              value={fieldValue}
                              onChange={(e) => {
                                setCustomValues(prev => ({
                                  ...prev,
                                  [fieldId]: e.target.value ? Number(e.target.value) : '',
                                }));
                              }}
                              placeholder={`กรุณากรอก${field.name}`}
                            />
                          )}
                          
                          {field.field_type === 'date' && (
                            <Input
                              type="date"
                              value={fieldValue}
                              onChange={(e) => {
                                setCustomValues(prev => ({
                                  ...prev,
                                  [fieldId]: e.target.value,
                                }));
                              }}
                            />
                          )}
                          
                          {field.field_type === 'boolean' && (
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={fieldValue === 'true' || fieldValue === true}
                                onCheckedChange={(checked) => {
                                  setCustomValues(prev => ({
                                    ...prev,
                                    [fieldId]: checked,
                                  }));
                                }}
                              />
                              <span className="text-sm text-muted-foreground">
                                {fieldValue === 'true' || fieldValue === true ? 'ใช่' : 'ไม่ใช่'}
                              </span>
                            </div>
                          )}
                          
                          {field.field_type === 'email' && (
                            <Input
                              type="email"
                              value={fieldValue}
                              onChange={(e) => {
                                setCustomValues(prev => ({
                                  ...prev,
                                  [fieldId]: e.target.value,
                                }));
                              }}
                              placeholder={`กรุณากรอก${field.name}`}
                            />
                          )}
                          
                          {field.field_type === 'phone' && (
                            <Input
                              type="tel"
                              value={fieldValue}
                              onChange={(e) => {
                                setCustomValues(prev => ({
                                  ...prev,
                                  [fieldId]: e.target.value,
                                }));
                              }}
                              placeholder={`กรุณากรอก${field.name}`}
                            />
                          )}
                          
                          {(field.field_type === 'select' || field.field_type === 'multi_select') && (
                            <div className="text-sm text-muted-foreground">
                              Select/Multi-select fields require additional configuration
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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

