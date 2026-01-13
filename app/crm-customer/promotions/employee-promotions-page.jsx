'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, User, Gift, UserPlus, LogOut, ScanLine, CheckCircle, Plus } from 'lucide-react';
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
import { Content } from '@/components/layouts/crm/components/content';
import { toast } from 'sonner';
import { employeeApi, authApi } from '@/lib/api';
import Link from 'next/link';
import PromotionsList from './promotions-list';
import { NewPromotionSheet } from './new-promotion-sheet';

export default function EmployeePromotionsPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isNewOpen, setIsNewOpen] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);

        // Check if employee
        const userRole = userData.role || userData.user_type || 'customer';
        const isEmployee = userRole === 'employee' || userRole === 'adminshop' || userRole === 'admin';

        if (!isEmployee) {
          // Redirect non-employees to customer promotions page
          router.push('/crm-customer/promotions');
          return;
        }

        // Load employee details using line_token
        const lineToken = userData.line_token || localStorage.getItem('line_token');
        
        if (lineToken) {
          try {
            const employeeData = await employeeApi.getByLineToken(lineToken);
            console.log('Employee details loaded:', employeeData);
            
            if (employeeData && employeeData.exists && employeeData.employee) {
              setUserDetails(employeeData.employee);
            } else if (employeeData && employeeData.employee) {
              setUserDetails(employeeData.employee);
            }
          } catch (error) {
            console.error('Failed to load employee details:', error);
          }
        }
      } else {
        router.push('/crm-customer/login');
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
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
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('line_token');
      localStorage.removeItem('shop_id');
      localStorage.removeItem('branch_id');

      if (typeof window !== 'undefined' && window.liff) {
        try {
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

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  const displayUser = userDetails || user;
  const userName = displayUser?.name || user?.name || 'ผู้ใช้งาน';
  const userAvatar = displayUser?.avatar_url || user?.avatar_url || '';
  const userPhone = displayUser?.phone || user?.phone || '-';

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header with Hamburger Menu */}
      <header className="sticky top-0 z-10 bg-background border-b border-border w-full">
        <div className="w-full mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">โปรโมชั่น</h1>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsNewOpen(true)}
              size="sm"
              className="hidden sm:flex"
            >
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มโปรโมชั่น
            </Button>
            
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
        </div>
      </header>

      {/* Promotions Content */}
      <Content className="block px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 w-full">
        <div className="w-full max-w-7xl mx-auto">
          {/* Mobile Add Button */}
          <div className="sm:hidden mb-4">
            <Button
              onClick={() => setIsNewOpen(true)}
              className="w-full"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มโปรโมชั่น
            </Button>
          </div>
          
          <PromotionsList key={refreshKey} />
        </div>
      </Content>

      <NewPromotionSheet 
        open={isNewOpen} 
        onOpenChange={setIsNewOpen}
        onSuccess={() => {
          handleRefresh();
          setIsNewOpen(false);
        }}
      />
    </div>
  );
}

