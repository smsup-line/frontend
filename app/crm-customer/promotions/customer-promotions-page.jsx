'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Gift, Coins, UserPlus, CheckCircle, ScanLine } from 'lucide-react';
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
import { promotionsApi, promotionHistoryApi, customerTokenLineApi, pointsApi } from '@/lib/api';
import { getShopId, getBranchId } from '@/lib/utils';
import Link from 'next/link';
import { User, LogOut } from 'lucide-react';

export default function CustomerPromotionsPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState({}); // Track which promotion is being redeemed
  const [customerPoints, setCustomerPoints] = useState(null); // Store customer total points

  useEffect(() => {
    loadUserData();
    loadPromotions();
  }, []);

  const loadUserData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        
        // Load user details to get current points
        const lineToken = userData.line_token || localStorage.getItem('line_token');
        if (lineToken && userData.role !== 'employee') {
          try {
            const customerResponse = await customerTokenLineApi.getByLineToken(lineToken);
            let customer = null;
            if (customerResponse.exists === true && customerResponse.customer) {
              customer = customerResponse.customer;
              setUser(customer);
            } else if (customerResponse.customer) {
              customer = customerResponse.customer;
              setUser(customer);
            }
            
            // Load customer points from points API
            if (customer?.id) {
              try {
                const pointsData = await pointsApi.getCustomerPoints(customer.id);
                setCustomerPoints(pointsData);
              } catch (pointsError) {
                console.error('Failed to load customer points:', pointsError);
              }
            }
          } catch (error) {
            console.error('Failed to load customer details:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const loadPromotions = async () => {
    try {
      setLoading(true);
      
      // Get shop_id and branch_id from localStorage
      const shopId = getShopId();
      const branchId = getBranchId();
      
      console.log('Loading promotions for shop_id:', shopId, 'branch_id:', branchId);
      
      // Build query parameters for public promotions API
      const params = {};
      if (shopId) {
        params.shop_id = shopId;
      }
      if (branchId) {
        params.branch_id = branchId;
      }
      
      // Use public promotions API endpoint
      const data = await promotionsApi.getPublic(params);
      const promotionsList = Array.isArray(data) ? data : [];
      
      // Backend already filters by shop_id and branch_id, so no need to filter again
      setPromotions(promotionsList);
      console.log('Promotions loaded:', promotionsList.length);
    } catch (error) {
      console.error('Failed to load promotions:', error);
      toast.error('ไม่สามารถโหลดโปรโมชั่นได้');
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (promotion) => {
    try {
      // Check if user is logged in
      if (!user || !user.id) {
        toast.error('กรุณาเข้าสู่ระบบก่อน');
        return;
      }

      // Get current customer points
      let currentPoints = 0;
      if (customerPoints?.total_points !== undefined) {
        currentPoints = customerPoints.total_points;
      } else {
        // Fallback to user data if customerPoints not loaded
        currentPoints = user.points || user.total_points || 0;
      }

      const requiredPoints = promotion.points || 0;

      // Check if user has enough points
      if (currentPoints < requiredPoints) {
        toast.error('คะแนนไม่พอ');
        return;
      }

      // Check if already redeeming
      if (redeeming[promotion.id]) {
        return;
      }

      // Confirm before redeeming
      if (!confirm(`คุณต้องการใช้ ${requiredPoints} คะแนนเพื่อรับสิทธิ์โปรโมชั่น "${promotion.name}" หรือไม่?`)) {
        return;
      }

      setRedeeming(prev => ({ ...prev, [promotion.id]: true }));

      // Get shop_id and branch_id
      const shopId = getShopId();
      const branchId = getBranchId();

      // Create promotion history according to API spec
      const promotionHistoryData = {
        promotion_id: promotion.id,
        customer_id: user.id,
        shop_id: shopId || null,
        branch_id: branchId || null,
      };

      console.log('Redeeming promotion with data:', promotionHistoryData);

      const response = await promotionHistoryApi.create(promotionHistoryData);
      
      toast.success('รับสิทธิ์โปรโมชั่นสำเร็จ');
      
      // Reload user data to update points
      await loadUserData();
      
      console.log('Promotion redeemed:', response);
    } catch (error) {
      console.error('Failed to redeem promotion:', error);
      const errorMessage = error.message || error.data?.message || 'ไม่สามารถรับสิทธิ์โปรโมชั่นได้';
      
      // Check if error is about insufficient points
      if (errorMessage.includes('คะแนน') || errorMessage.includes('points') || errorMessage.includes('insufficient')) {
        toast.error('คะแนนไม่พอ');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setRedeeming(prev => {
        const newState = { ...prev };
        delete newState[promotion.id];
        return newState;
      });
    }
  };

  const handleLogout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('line_token');
      localStorage.removeItem('shop_id');
      localStorage.removeItem('branch_id');

      // Logout from LINE
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  const userName = user?.name || 'ผู้ใช้งาน';
  const userAvatar = user?.avatar_url || '';
  const userPhone = user?.phone || '-';
  const userRole = user?.role || user?.user_type || 'customer';
  const isEmployee = userRole === 'employee';

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header with Hamburger Menu */}
      <header className="sticky top-0 z-10 bg-background border-b border-border w-full">
        <div className="w-full mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">โปรโมชั่น</h1>
          
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

      {/* Promotions Content */}
      <Content className="block py-4 sm:py-6 md:py-8 w-full">
        <div className="w-full mx-auto px-3 sm:px-4 md:px-6 max-w-2xl">
          {promotions.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Gift className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
              <p className="text-base sm:text-lg text-muted-foreground">ไม่มีโปรโมชั่นในขณะนี้</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {promotions.map((promotion) => (
                <div
                  key={promotion.id}
                  className="rounded-lg border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow w-full"
                >
                  <div className="flex flex-col sm:flex-row w-full">
                    {/* Promotion Image */}
                    <div className="relative w-full sm:w-40 md:w-48 h-48 sm:h-auto flex-shrink-0">
                      {promotion.image_url ? (
                        <img
                          src={promotion.image_url}
                          alt={promotion.name || 'โปรโมชั่น'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-full h-full bg-muted flex items-center justify-center ${promotion.image_url ? 'hidden' : ''}`}
                      >
                        <Gift className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-muted-foreground" />
                      </div>
                    </div>
                    
                    {/* Promotion Details */}
                    <div className="flex-1 p-4 sm:p-5 md:p-6 flex flex-col justify-between min-w-0">
                      <div className="min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold mb-2 break-words">{promotion.name || 'โปรโมชั่น'}</h3>
                        {promotion.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-4 break-words">
                            {promotion.description.replace(/<[^>]*>/g, '')}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2 mt-3 sm:mt-4">
                        <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-primary/10 rounded-full">
                          <Coins className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-semibold text-primary whitespace-nowrap">
                            {promotion.points || 0} คะแนน
                          </span>
                        </div>
                        
                        {!isEmployee && (
                          <Button
                            onClick={() => handleRedeem(promotion)}
                            disabled={redeeming[promotion.id] || (customerPoints?.total_points ?? user?.points ?? user?.total_points ?? 0) < (promotion.points || 0)}
                            className="w-full sm:w-auto flex-shrink-0"
                            size="sm"
                          >
                            {redeeming[promotion.id] ? (
                              <>
                                <span className="animate-spin mr-2">⏳</span>
                                กำลังดำเนินการ...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                รับสิทธิ์
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Content>
    </div>
  );
}


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Gift, Coins, UserPlus, CheckCircle, ScanLine } from 'lucide-react';
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
import { promotionsApi, promotionHistoryApi, customerTokenLineApi, pointsApi } from '@/lib/api';
import { getShopId, getBranchId } from '@/lib/utils';
import Link from 'next/link';
import { User, LogOut } from 'lucide-react';

export default function CustomerPromotionsPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState({}); // Track which promotion is being redeemed
  const [customerPoints, setCustomerPoints] = useState(null); // Store customer total points

  useEffect(() => {
    loadUserData();
    loadPromotions();
  }, []);

  const loadUserData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        
        // Load user details to get current points
        const lineToken = userData.line_token || localStorage.getItem('line_token');
        if (lineToken && userData.role !== 'employee') {
          try {
            const customerResponse = await customerTokenLineApi.getByLineToken(lineToken);
            let customer = null;
            if (customerResponse.exists === true && customerResponse.customer) {
              customer = customerResponse.customer;
              setUser(customer);
            } else if (customerResponse.customer) {
              customer = customerResponse.customer;
              setUser(customer);
            }
            
            // Load customer points from points API
            if (customer?.id) {
              try {
                const pointsData = await pointsApi.getCustomerPoints(customer.id);
                setCustomerPoints(pointsData);
              } catch (pointsError) {
                console.error('Failed to load customer points:', pointsError);
              }
            }
          } catch (error) {
            console.error('Failed to load customer details:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const loadPromotions = async () => {
    try {
      setLoading(true);
      
      // Get shop_id and branch_id from localStorage
      const shopId = getShopId();
      const branchId = getBranchId();
      
      console.log('Loading promotions for shop_id:', shopId, 'branch_id:', branchId);
      
      // Build query parameters for public promotions API
      const params = {};
      if (shopId) {
        params.shop_id = shopId;
      }
      if (branchId) {
        params.branch_id = branchId;
      }
      
      // Use public promotions API endpoint
      const data = await promotionsApi.getPublic(params);
      const promotionsList = Array.isArray(data) ? data : [];
      
      // Backend already filters by shop_id and branch_id, so no need to filter again
      setPromotions(promotionsList);
      console.log('Promotions loaded:', promotionsList.length);
    } catch (error) {
      console.error('Failed to load promotions:', error);
      toast.error('ไม่สามารถโหลดโปรโมชั่นได้');
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (promotion) => {
    try {
      // Check if user is logged in
      if (!user || !user.id) {
        toast.error('กรุณาเข้าสู่ระบบก่อน');
        return;
      }

      // Get current customer points
      let currentPoints = 0;
      if (customerPoints?.total_points !== undefined) {
        currentPoints = customerPoints.total_points;
      } else {
        // Fallback to user data if customerPoints not loaded
        currentPoints = user.points || user.total_points || 0;
      }

      const requiredPoints = promotion.points || 0;

      // Check if user has enough points
      if (currentPoints < requiredPoints) {
        toast.error('คะแนนไม่พอ');
        return;
      }

      // Check if already redeeming
      if (redeeming[promotion.id]) {
        return;
      }

      // Confirm before redeeming
      if (!confirm(`คุณต้องการใช้ ${requiredPoints} คะแนนเพื่อรับสิทธิ์โปรโมชั่น "${promotion.name}" หรือไม่?`)) {
        return;
      }

      setRedeeming(prev => ({ ...prev, [promotion.id]: true }));

      // Get shop_id and branch_id
      const shopId = getShopId();
      const branchId = getBranchId();

      // Create promotion history according to API spec
      const promotionHistoryData = {
        promotion_id: promotion.id,
        customer_id: user.id,
        shop_id: shopId || null,
        branch_id: branchId || null,
      };

      console.log('Redeeming promotion with data:', promotionHistoryData);

      const response = await promotionHistoryApi.create(promotionHistoryData);
      
      toast.success('รับสิทธิ์โปรโมชั่นสำเร็จ');
      
      // Reload user data to update points
      await loadUserData();
      
      console.log('Promotion redeemed:', response);
    } catch (error) {
      console.error('Failed to redeem promotion:', error);
      const errorMessage = error.message || error.data?.message || 'ไม่สามารถรับสิทธิ์โปรโมชั่นได้';
      
      // Check if error is about insufficient points
      if (errorMessage.includes('คะแนน') || errorMessage.includes('points') || errorMessage.includes('insufficient')) {
        toast.error('คะแนนไม่พอ');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setRedeeming(prev => {
        const newState = { ...prev };
        delete newState[promotion.id];
        return newState;
      });
    }
  };

  const handleLogout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('line_token');
      localStorage.removeItem('shop_id');
      localStorage.removeItem('branch_id');

      // Logout from LINE
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  const userName = user?.name || 'ผู้ใช้งาน';
  const userAvatar = user?.avatar_url || '';
  const userPhone = user?.phone || '-';
  const userRole = user?.role || user?.user_type || 'customer';
  const isEmployee = userRole === 'employee';

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header with Hamburger Menu */}
      <header className="sticky top-0 z-10 bg-background border-b border-border w-full">
        <div className="w-full mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">โปรโมชั่น</h1>
          
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

      {/* Promotions Content */}
      <Content className="block py-4 sm:py-6 md:py-8 w-full">
        <div className="w-full mx-auto px-3 sm:px-4 md:px-6 max-w-2xl">
          {promotions.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Gift className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
              <p className="text-base sm:text-lg text-muted-foreground">ไม่มีโปรโมชั่นในขณะนี้</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {promotions.map((promotion) => (
                <div
                  key={promotion.id}
                  className="rounded-lg border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow w-full"
                >
                  <div className="flex flex-col sm:flex-row w-full">
                    {/* Promotion Image */}
                    <div className="relative w-full sm:w-40 md:w-48 h-48 sm:h-auto flex-shrink-0">
                      {promotion.image_url ? (
                        <img
                          src={promotion.image_url}
                          alt={promotion.name || 'โปรโมชั่น'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-full h-full bg-muted flex items-center justify-center ${promotion.image_url ? 'hidden' : ''}`}
                      >
                        <Gift className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-muted-foreground" />
                      </div>
                    </div>
                    
                    {/* Promotion Details */}
                    <div className="flex-1 p-4 sm:p-5 md:p-6 flex flex-col justify-between min-w-0">
                      <div className="min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold mb-2 break-words">{promotion.name || 'โปรโมชั่น'}</h3>
                        {promotion.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-4 break-words">
                            {promotion.description.replace(/<[^>]*>/g, '')}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2 mt-3 sm:mt-4">
                        <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-primary/10 rounded-full">
                          <Coins className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-semibold text-primary whitespace-nowrap">
                            {promotion.points || 0} คะแนน
                          </span>
                        </div>
                        
                        {!isEmployee && (
                          <Button
                            onClick={() => handleRedeem(promotion)}
                            disabled={redeeming[promotion.id] || (customerPoints?.total_points ?? user?.points ?? user?.total_points ?? 0) < (promotion.points || 0)}
                            className="w-full sm:w-auto flex-shrink-0"
                            size="sm"
                          >
                            {redeeming[promotion.id] ? (
                              <>
                                <span className="animate-spin mr-2">⏳</span>
                                กำลังดำเนินการ...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                รับสิทธิ์
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Content>
    </div>
  );
}


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Gift, Coins, UserPlus, CheckCircle, ScanLine } from 'lucide-react';
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
import { promotionsApi, promotionHistoryApi, customerTokenLineApi, pointsApi } from '@/lib/api';
import { getShopId, getBranchId } from '@/lib/utils';
import Link from 'next/link';
import { User, LogOut } from 'lucide-react';

export default function CustomerPromotionsPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState({}); // Track which promotion is being redeemed
  const [customerPoints, setCustomerPoints] = useState(null); // Store customer total points

  useEffect(() => {
    loadUserData();
    loadPromotions();
  }, []);

  const loadUserData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        
        // Load user details to get current points
        const lineToken = userData.line_token || localStorage.getItem('line_token');
        if (lineToken && userData.role !== 'employee') {
          try {
            const customerResponse = await customerTokenLineApi.getByLineToken(lineToken);
            let customer = null;
            if (customerResponse.exists === true && customerResponse.customer) {
              customer = customerResponse.customer;
              setUser(customer);
            } else if (customerResponse.customer) {
              customer = customerResponse.customer;
              setUser(customer);
            }
            
            // Load customer points from points API
            if (customer?.id) {
              try {
                const pointsData = await pointsApi.getCustomerPoints(customer.id);
                setCustomerPoints(pointsData);
              } catch (pointsError) {
                console.error('Failed to load customer points:', pointsError);
              }
            }
          } catch (error) {
            console.error('Failed to load customer details:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const loadPromotions = async () => {
    try {
      setLoading(true);
      
      // Get shop_id and branch_id from localStorage
      const shopId = getShopId();
      const branchId = getBranchId();
      
      console.log('Loading promotions for shop_id:', shopId, 'branch_id:', branchId);
      
      // Build query parameters for public promotions API
      const params = {};
      if (shopId) {
        params.shop_id = shopId;
      }
      if (branchId) {
        params.branch_id = branchId;
      }
      
      // Use public promotions API endpoint
      const data = await promotionsApi.getPublic(params);
      const promotionsList = Array.isArray(data) ? data : [];
      
      // Backend already filters by shop_id and branch_id, so no need to filter again
      setPromotions(promotionsList);
      console.log('Promotions loaded:', promotionsList.length);
    } catch (error) {
      console.error('Failed to load promotions:', error);
      toast.error('ไม่สามารถโหลดโปรโมชั่นได้');
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (promotion) => {
    try {
      // Check if user is logged in
      if (!user || !user.id) {
        toast.error('กรุณาเข้าสู่ระบบก่อน');
        return;
      }

      // Get current customer points
      let currentPoints = 0;
      if (customerPoints?.total_points !== undefined) {
        currentPoints = customerPoints.total_points;
      } else {
        // Fallback to user data if customerPoints not loaded
        currentPoints = user.points || user.total_points || 0;
      }

      const requiredPoints = promotion.points || 0;

      // Check if user has enough points
      if (currentPoints < requiredPoints) {
        toast.error('คะแนนไม่พอ');
        return;
      }

      // Check if already redeeming
      if (redeeming[promotion.id]) {
        return;
      }

      // Confirm before redeeming
      if (!confirm(`คุณต้องการใช้ ${requiredPoints} คะแนนเพื่อรับสิทธิ์โปรโมชั่น "${promotion.name}" หรือไม่?`)) {
        return;
      }

      setRedeeming(prev => ({ ...prev, [promotion.id]: true }));

      // Get shop_id and branch_id
      const shopId = getShopId();
      const branchId = getBranchId();

      // Create promotion history according to API spec
      const promotionHistoryData = {
        promotion_id: promotion.id,
        customer_id: user.id,
        shop_id: shopId || null,
        branch_id: branchId || null,
      };

      console.log('Redeeming promotion with data:', promotionHistoryData);

      const response = await promotionHistoryApi.create(promotionHistoryData);
      
      toast.success('รับสิทธิ์โปรโมชั่นสำเร็จ');
      
      // Reload user data to update points
      await loadUserData();
      
      console.log('Promotion redeemed:', response);
    } catch (error) {
      console.error('Failed to redeem promotion:', error);
      const errorMessage = error.message || error.data?.message || 'ไม่สามารถรับสิทธิ์โปรโมชั่นได้';
      
      // Check if error is about insufficient points
      if (errorMessage.includes('คะแนน') || errorMessage.includes('points') || errorMessage.includes('insufficient')) {
        toast.error('คะแนนไม่พอ');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setRedeeming(prev => {
        const newState = { ...prev };
        delete newState[promotion.id];
        return newState;
      });
    }
  };

  const handleLogout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('line_token');
      localStorage.removeItem('shop_id');
      localStorage.removeItem('branch_id');

      // Logout from LINE
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  const userName = user?.name || 'ผู้ใช้งาน';
  const userAvatar = user?.avatar_url || '';
  const userPhone = user?.phone || '-';
  const userRole = user?.role || user?.user_type || 'customer';
  const isEmployee = userRole === 'employee';

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header with Hamburger Menu */}
      <header className="sticky top-0 z-10 bg-background border-b border-border w-full">
        <div className="w-full mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">โปรโมชั่น</h1>
          
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

      {/* Promotions Content */}
      <Content className="block py-4 sm:py-6 md:py-8 w-full">
        <div className="w-full mx-auto px-3 sm:px-4 md:px-6 max-w-2xl">
          {promotions.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Gift className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
              <p className="text-base sm:text-lg text-muted-foreground">ไม่มีโปรโมชั่นในขณะนี้</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {promotions.map((promotion) => (
                <div
                  key={promotion.id}
                  className="rounded-lg border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow w-full"
                >
                  <div className="flex flex-col sm:flex-row w-full">
                    {/* Promotion Image */}
                    <div className="relative w-full sm:w-40 md:w-48 h-48 sm:h-auto flex-shrink-0">
                      {promotion.image_url ? (
                        <img
                          src={promotion.image_url}
                          alt={promotion.name || 'โปรโมชั่น'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-full h-full bg-muted flex items-center justify-center ${promotion.image_url ? 'hidden' : ''}`}
                      >
                        <Gift className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-muted-foreground" />
                      </div>
                    </div>
                    
                    {/* Promotion Details */}
                    <div className="flex-1 p-4 sm:p-5 md:p-6 flex flex-col justify-between min-w-0">
                      <div className="min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold mb-2 break-words">{promotion.name || 'โปรโมชั่น'}</h3>
                        {promotion.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-4 break-words">
                            {promotion.description.replace(/<[^>]*>/g, '')}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2 mt-3 sm:mt-4">
                        <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-primary/10 rounded-full">
                          <Coins className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-semibold text-primary whitespace-nowrap">
                            {promotion.points || 0} คะแนน
                          </span>
                        </div>
                        
                        {!isEmployee && (
                          <Button
                            onClick={() => handleRedeem(promotion)}
                            disabled={redeeming[promotion.id] || (customerPoints?.total_points ?? user?.points ?? user?.total_points ?? 0) < (promotion.points || 0)}
                            className="w-full sm:w-auto flex-shrink-0"
                            size="sm"
                          >
                            {redeeming[promotion.id] ? (
                              <>
                                <span className="animate-spin mr-2">⏳</span>
                                กำลังดำเนินการ...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                รับสิทธิ์
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Content>
    </div>
  );
}

