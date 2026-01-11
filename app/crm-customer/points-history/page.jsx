'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, User, Coins, Gift, UserPlus, LogOut, ScanLine } from 'lucide-react';
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
import { customerTokenLineApi, pointsApi } from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function PointsHistoryPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [pointsData, setPointsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      // Load user from localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);

        // Check if customer (not employee)
        const userRole = userData.role || userData.user_type || 'customer';
        const isEmployee = userRole === 'employee';

        if (isEmployee) {
          // Redirect employees to profile
          router.push('/crm-customer/profile');
          return;
        }

        // Load customer details using line_token
        const lineToken = userData.line_token || localStorage.getItem('line_token');
        
        if (lineToken) {
          try {
            const customerData = await customerTokenLineApi.getByLineToken(lineToken);
            console.log('Customer details loaded:', customerData);
            
            if (customerData && customerData.exists && customerData.customer) {
              setUserDetails(customerData.customer);
              
              // Load customer points history
              const customerId = customerData.customer.id;
              if (customerId) {
                try {
                  console.log('Loading customer points for ID:', customerId);
                  const pointsResponse = await pointsApi.getCustomerPoints(customerId);
                  console.log('Customer points loaded:', pointsResponse);
                  setPointsData(pointsResponse);
                } catch (pointsError) {
                  console.error('Failed to load customer points:', pointsError);
                  toast.error('ไม่สามารถโหลดประวัติคะแนนสะสมได้');
                }
              } else {
                console.warn('Customer ID not found in customer data');
              }
            }
          } catch (error) {
            console.error('Failed to load customer details:', error);
            toast.error('ไม่สามารถโหลดข้อมูลลูกค้าได้');
          }
        }
      } else {
        // No user data, redirect to login
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
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('line_token');
      localStorage.removeItem('shop_id');
      localStorage.removeItem('branch_id');

      if (typeof window !== 'undefined' && window.liff) {
        try {
          window.liff.logout();
        } catch (liffError) {
          console.log('LIFF logout error (non-critical):', liffError);
        }
      }

      toast.success('ออกจากระบบสำเร็จ');
      router.push('/crm-customer/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch {
      return '-';
    }
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
  const totalPoints = pointsData?.total_points || 0;
  const pointsHistory = pointsData?.points_history || [];

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header with Hamburger Menu */}
      <header className="sticky top-0 z-10 bg-background border-b border-border w-full">
        <div className="w-full mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">คะแนนสะสม</h1>
          
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

      <Content className="block px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 w-full">
        <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* Total Points Card */}
          <div className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm sm:text-base text-muted-foreground">คะแนนสะสมทั้งหมด</p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold mt-1">{totalPoints.toLocaleString()}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3 sm:p-4">
                <Coins className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
            </div>
          </div>

          {/* Points History */}
          <div className="rounded-lg border border-border bg-card shadow-sm">
            <div className="p-4 sm:p-6 border-b border-border">
              <h2 className="text-lg sm:text-xl font-bold">ประวัติคะแนนสะสม</h2>
            </div>
            
            {pointsHistory.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <Coins className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-sm sm:text-base">ยังไม่มีประวัติคะแนนสะสม</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pointsHistory.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="p-4 sm:p-6 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base mb-1">
                          {item.detail || item.description || 'ไม่ระบุรายละเอียด'}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {formatDate(item.created_at || item.createdAt)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge
                          variant={item.points > 0 ? 'success' : 'destructive'}
                          appearance="light"
                          size="sm"
                          className="text-sm sm:text-base font-semibold"
                        >
                          {item.points > 0 ? '+' : ''}{item.points?.toLocaleString() || 0}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Content>
    </div>
  );
}
