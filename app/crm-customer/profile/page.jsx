'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, User, Coins, Gift, UserPlus, LogOut, ScanLine, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Content } from '@/components/layouts/crm/components/content';
import { toast } from 'sonner';
import { authApi, customerApi, employeeApi, customerTokenLineApi, pointsApi, customerPhoneApi } from '@/lib/api';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null); // Store employee or customer details
  const [customerPoints, setCustomerPoints] = useState(null); // Store customer points data
  const [loading, setLoading] = useState(true);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Load user from localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);

        // Load user details from API based on role using line_token
        const lineToken = userData.line_token || localStorage.getItem('line_token');
        
        if (lineToken) {
          try {
            const userRole = userData.role || userData.user_type || 'customer';
            const isEmployee = userRole === 'employee';
            
            console.log('Loading user details - Role:', userRole, 'Line Token:', lineToken);
            
            if (isEmployee) {
              // Fetch employee details using line_token
              console.log('Fetching employee details from /api/employeetokenline?line_token=' + lineToken);
              const employeeResponse = await employeeApi.getByLineToken(lineToken);
              
              // Extract employee data from response
              if (employeeResponse.exists === true && employeeResponse.employee) {
                setUserDetails(employeeResponse.employee);
                console.log('Employee details loaded:', employeeResponse.employee);
              } else if (employeeResponse.employee) {
                setUserDetails(employeeResponse.employee);
                console.log('Employee details loaded (alternative format):', employeeResponse.employee);
              }
            } else {
              // Fetch customer details using line_token
              console.log('Fetching customer details from /api/customertokenline?line_token=' + lineToken);
              const customerResponse = await customerTokenLineApi.getByLineToken(lineToken);
              
              // Extract customer data from response
              if (customerResponse.exists === true && customerResponse.customer) {
                setUserDetails(customerResponse.customer);
                console.log('Customer details loaded:', customerResponse.customer);
              } else if (customerResponse.customer) {
                setUserDetails(customerResponse.customer);
                console.log('Customer details loaded (alternative format):', customerResponse.customer);
              }
              
              // Fetch customer points (total_points and points_history)
              try {
                // Get customer_id from userDetails or user
                const customerId = userDetails?.id || userData?.id;
                console.log('Fetching customer points from /api/customerpoint');
                console.log('Customer ID:', customerId);
                const pointsData = await pointsApi.getCustomerPoints(customerId);
                console.log('Customer points loaded:', pointsData);
                setCustomerPoints(pointsData);
              } catch (pointsError) {
                console.error('Failed to load customer points:', pointsError);
                // Continue without points data if API call fails
              }
            }
          } catch (error) {
            console.error('Failed to load user details:', error);
            // Continue with user data from localStorage if API call fails
          }
        } else {
          console.log('No line_token found, using user data from localStorage');
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Try to call logout API (optional, don't fail if it errors)
      try {
        await authApi.logout();
      } catch (apiError) {
        console.log('Logout API call failed (non-critical):', apiError);
        // Continue with logout even if API call fails
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear localStorage regardless of API call result
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('line_token');
      localStorage.removeItem('shop_id');
      localStorage.removeItem('branch_id');
      
      // Logout from LINE (only if LIFF is initialized)
      if (typeof window !== 'undefined' && window.liff) {
        try {
          // Check if LIFF is initialized before calling logout
          // LIFF may not be initialized if user is on profile page without going through login
          if (window.liff.isLoggedIn && typeof window.liff.logout === 'function') {
            window.liff.logout();
          }
        } catch (liffError) {
          console.log('LIFF logout error (non-critical):', liffError);
        }
      }
      
      toast.success('ออกจากระบบสำเร็จ');
      router.push('/crm-customer/login');
    }
  };

  // Initialize phone value when user details are loaded
  useEffect(() => {
    if (!isEditingPhone) {
      const currentPhone = userDetails?.phone || user?.phone || '';
      setPhoneValue(currentPhone);
    }
  }, [userDetails?.phone, user?.phone, isEditingPhone]);

  const handleStartEditPhone = () => {
    const currentPhone = userDetails?.phone || user?.phone || '';
    // Redirect to verify phone page with current phone as query parameter
    router.push(`/crm-customer/verify-phone${currentPhone ? `?phone=${currentPhone}` : ''}`);
  };
  
  const handleCancelEditPhone = () => {
    const currentPhone = userDetails?.phone || user?.phone || '';
    setPhoneValue(currentPhone);
    setIsEditingPhone(false);
  };
  
  const handleSavePhone = async () => {
    if (!phoneValue.trim()) {
      toast.error('กรุณากรอกเบอร์โทรศัพท์');
      return;
    }
    
    const displayUser = userDetails || user;
    const customerId = displayUser?.id || user?.id;
    if (!customerId) {
      toast.error('ไม่พบรหัสลูกค้า');
      return;
    }
    
    try {
      setSavingPhone(true);
      await customerPhoneApi.update({
        customer_id: customerId,
        phone: phoneValue.trim(),
      });
      
      // Update local state
      if (userDetails) {
        setUserDetails({ ...userDetails, phone: phoneValue.trim() });
      } else if (user) {
        setUser({ ...user, phone: phoneValue.trim() });
      }
      
      // Update localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          userData.phone = phoneValue.trim();
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (e) {
          console.error('Failed to update user in localStorage:', e);
        }
      }
      
      toast.success('แก้ไขเบอร์โทรศัพท์สำเร็จ');
      setIsEditingPhone(false);
    } catch (error) {
      console.error('Failed to update phone:', error);
      toast.error(error.message || 'ไม่สามารถแก้ไขเบอร์โทรศัพท์ได้');
    } finally {
      setSavingPhone(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  // Merge user data with userDetails (employee or customer)
  const displayUser = userDetails || user;
  const userName = displayUser?.name || user?.name || 'ผู้ใช้งาน';
  const userAvatar = displayUser?.avatar_url || user?.avatar_url || '';
  const userPhone = displayUser?.phone || user?.phone || '-';
  // ใช้ total_points จาก customerPoints API ถ้ามี ไม่เช่นนั้นใช้จาก userDetails หรือ user
  const userPoints = customerPoints?.total_points ?? displayUser?.points ?? displayUser?.total_points ?? 0;
  const userRole = user?.role || user?.user_type || 'customer';
  const isEmployee = userRole === 'employee';

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header with Hamburger Menu */}
      <header className="sticky top-0 z-10 bg-background border-b border-border w-full">
        <div className="w-full mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">โปรไฟล์</h1>
          
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" mode="icon" size="lg" className="flex-shrink-0">
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-80 max-w-sm">
              <SheetTitle className="sr-only">เมนู</SheetTitle>
              <SheetHeader>
                <div className="flex items-center gap-3 pb-4">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                    <AvatarImage src={userAvatar} alt={userName} />
                    <AvatarFallback className="text-sm sm:text-base">{userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm sm:text-base truncate">{userName}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{userPhone}</p>
                  </div>
                </div>
              </SheetHeader>
              <SheetBody className="pt-4">
                <nav className="space-y-2">
                  <Link href="/crm-customer/profile">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm sm:text-base"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      หน้าโปรไฟล์
                    </Button>
                  </Link>
                  
                  {isEmployee ? (
                    // Employee menu
                    <>
                      <Link href="/crm-customer/add-customer">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm sm:text-base"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          เพิ่มลูกค้า
                        </Button>
                      </Link>
                      
                      <Link href="/crm-customer/approve-promotions">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm sm:text-base"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          ยืนยันโปรโมชั่น
                        </Button>
                      </Link>
                      
                      <Link href="/crm-customer/receipt-scanner/employee">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm sm:text-base"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <ScanLine className="mr-2 h-4 w-4" />
                          สแกนใบเสร็จ
                        </Button>
                      </Link>
                    </>
                  ) : (
                    // Customer menu
                    <>
                      <Link href="/crm-customer/points-history">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm sm:text-base"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Coins className="mr-2 h-4 w-4" />
                          คะแนนสะสม
                        </Button>
                      </Link>
                      
                      <Link href="/crm-customer/promotions">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm sm:text-base"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Gift className="mr-2 h-4 w-4" />
                          โปรโมชั่น
                        </Button>
                      </Link>
                      
                      <Link href="/crm-customer/my-promotions">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm sm:text-base"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Gift className="mr-2 h-4 w-4" />
                          โปรโมชั่นของฉัน
                        </Button>
                      </Link>
                      
                      <Link href="/crm-customer/receipt-scanner">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm sm:text-base"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <ScanLine className="mr-2 h-4 w-4" />
                          สแกนใบเสร็จ
                        </Button>
                      </Link>
                    </>
                  )}
                  
                  <Separator className="my-4" />
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive text-sm sm:text-base"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    ออกจากระบบ
                  </Button>
                </nav>
              </SheetBody>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Profile Content */}
      <Content className="block py-4 sm:py-6 md:py-8 w-full">
        <div className="w-full mx-auto px-3 sm:px-4 md:px-6 max-w-2xl">
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Profile Card */}
            <div className="rounded-lg border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm">
              <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback className="text-xl sm:text-2xl">
                    {userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="text-center space-y-1">
                  <h2 className="text-xl sm:text-2xl font-bold break-words">{userName}</h2>
                  <p className="text-sm sm:text-base text-muted-foreground">{isEmployee ? 'พนักงาน' : 'ลูกค้า'}</p>
                </div>
              </div>
            </div>

            {/* Information Card */}
            <div className="rounded-lg border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">ข้อมูลส่วนตัว</h3>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">เบอร์โทรศัพท์</span>
                  {!isEmployee && isEditingPhone ? (
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <Input
                        type="tel"
                        value={phoneValue}
                        onChange={(e) => setPhoneValue(e.target.value)}
                        className="h-8 w-32 sm:w-40 text-xs sm:text-sm"
                        placeholder="เบอร์โทรศัพท์"
                        disabled={savingPhone}
                      />
                      <Button
                        size="sm"
                        onClick={handleSavePhone}
                        disabled={savingPhone}
                        className="h-8 text-xs"
                      >
                        {savingPhone ? 'กำลังบันทึก...' : 'บันทึก'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEditPhone}
                        disabled={savingPhone}
                        className="h-8 text-xs"
                      >
                        ยกเลิก
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs sm:text-sm text-right break-all">{userPhone}</span>
                      {!isEmployee && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleStartEditPhone}
                          className="h-7 text-xs px-2"
                        >
                          แก้ไข
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
                {!isEmployee && (
                  <>
                    <Separator />
                    
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">คะแนนสะสม</span>
                      <span className="font-medium text-xs sm:text-sm text-primary text-right">{userPoints} คะแนน</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {!isEmployee && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Link href="/crm-customer/points-history">
                  <div className="rounded-lg border border-border bg-card p-3 sm:p-4 shadow-sm hover:bg-accent transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="rounded-full bg-primary/10 p-1.5 sm:p-2 flex-shrink-0">
                        <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm sm:text-base">คะแนนสะสม</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">ดูประวัติ</p>
                      </div>
                    </div>
                  </div>
                </Link>
                
                <Link href="/crm-customer/promotions">
                  <div className="rounded-lg border border-border bg-card p-3 sm:p-4 shadow-sm hover:bg-accent transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="rounded-full bg-primary/10 p-1.5 sm:p-2 flex-shrink-0">
                        <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm sm:text-base">โปรโมชั่น</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">ดูโปรโมชั่น</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}
            
            {isEmployee && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Link href="/crm-customer/add-customer">
                  <div className="rounded-lg border border-border bg-card p-3 sm:p-4 shadow-sm hover:bg-accent transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="rounded-full bg-primary/10 p-1.5 sm:p-2 flex-shrink-0">
                        <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm sm:text-base">เพิ่มลูกค้า</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">สร้าง QR Code</p>
                      </div>
                    </div>
                  </div>
                </Link>
                
                <Link href="/crm-customer/approve-promotions">
                  <div className="rounded-lg border border-border bg-card p-3 sm:p-4 shadow-sm hover:bg-accent transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="rounded-full bg-primary/10 p-1.5 sm:p-2 flex-shrink-0">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm sm:text-base">ยืนยันโปรโมชั่น</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">อนุมัติโปรโมชั่น</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </Content>
    </div>
  );
}

