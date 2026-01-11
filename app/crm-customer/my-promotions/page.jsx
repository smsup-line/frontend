'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Gift, Coins, User, LogOut, ScanLine } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Content } from '@/components/layouts/crm/components/content';
import { toast } from 'sonner';
import { myPromotionsApi, customerTokenLineApi } from '@/lib/api';
import Link from 'next/link';

export default function MyPromotionsPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [promotionHistory, setPromotionHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await loadUserData();
      // Wait a bit for user state to update, then load promotions
      setTimeout(() => {
        loadMyPromotions();
      }, 100);
    };
    init();
  }, []);

  const loadUserData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        
        // Load user details if customer
        const lineToken = userData.line_token || localStorage.getItem('line_token');
        if (lineToken && userData.role !== 'employee') {
          try {
            const customerResponse = await customerTokenLineApi.getByLineToken(lineToken);
            if (customerResponse && customerResponse.exists && customerResponse.customer) {
              setUser(customerResponse.customer);
            } else if (customerResponse && customerResponse.customer) {
              setUser(customerResponse.customer);
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

  const loadMyPromotions = async () => {
    try {
      setLoading(true);
      
      // Get user data - use current user state (may be updated by loadUserData)
      const currentUser = user || (() => {
        try {
          const userStr = localStorage.getItem('user');
          return userStr ? JSON.parse(userStr) : null;
        } catch {
          return null;
        }
      })();
      
      if (!currentUser) {
        toast.error('กรุณาเข้าสู่ระบบก่อน');
        router.push('/crm-customer/login');
        return;
      }

      // Get customer_id, shop_id, branch_id
      const customerId = currentUser.id || currentUser.customer_id;
      const shopId = currentUser.shop_id || localStorage.getItem('shop_id');
      const branchId = currentUser.branch_id || localStorage.getItem('branch_id');

      if (!customerId) {
        toast.error('ไม่พบรหัสลูกค้า');
        return;
      }

      // Build query parameters
      const params = {
        customer_id: customerId,
      };
      if (shopId) params.shop_id = shopId;
      if (branchId) params.branch_id = branchId;

      console.log('Loading my promotions with params:', params);

      // Fetch my promotions with query parameters (no auth header needed)
      const data = await myPromotionsApi.getAll(params);
      
      const historyList = Array.isArray(data) ? data : [];
      
      // Sort by created_at descending (newest first)
      historyList.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });
      
      setPromotionHistory(historyList);
      console.log('My promotions loaded:', historyList.length, historyList);
    } catch (error) {
      console.error('Failed to load my promotions:', error);
      toast.error(error.message || 'ไม่สามารถโหลดโปรโมชั่นของฉันได้');
      setPromotionHistory([]);
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
          if (window.liff.isLoggedIn && typeof window.liff.logout === 'function') {
            window.liff.logout();
          }
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

  const formatDateString = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="success" appearance="light" size="sm">
            อนุมัติ
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" appearance="light" size="sm">
            รอดำเนินการ
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" appearance="light" size="sm">
            ไม่อนุมัติ
          </Badge>
        );
      default:
        return (
          <Badge variant="default" appearance="light" size="sm">
            {status || 'ไม่ทราบสถานะ'}
          </Badge>
        );
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

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header with Hamburger Menu */}
      <header className="sticky top-0 z-10 bg-background border-b border-border w-full">
        <div className="w-full mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">โปรโมชั่นของฉัน</h1>
          
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

      {/* My Promotions Content */}
      <Content className="block py-4 sm:py-6 md:py-8 w-full">
        <div className="w-full mx-auto px-3 sm:px-4 md:px-6 max-w-2xl">
          {promotionHistory.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Gift className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
              <p className="text-base sm:text-lg text-muted-foreground">ยังไม่มีโปรโมชั่นที่รับสิทธิ์</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {promotionHistory.map((history) => {
                const promotion = history.promotion || {};
                const shop = history.shop || {};
                const branch = history.branch || {};
                const approvedByEmployee = history.approved_by_employee || {};
                
                const redeemDate = formatDateString(history.created_at);
                const approvedDate = formatDateString(history.approved_at);
                
                return (
                  <div
                    key={history.id}
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
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-lg sm:text-xl font-bold break-words">{promotion.name || 'โปรโมชั่น'}</h3>
                            {getStatusBadge(history.status)}
                          </div>
                          
                          {promotion.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-4 break-words">
                              {promotion.description.replace(/<[^>]*>/g, '')}
                            </p>
                          )}
                          
                          <div className="space-y-2">
                            {history.points_used && (
                              <div>
                                <p className="text-xs sm:text-sm text-muted-foreground">คะแนนที่ใช้</p>
                                <p className="text-xs sm:text-sm font-medium">{history.points_used.toLocaleString()} คะแนน</p>
                              </div>
                            )}
                            
                            <div>
                              <p className="text-xs sm:text-sm text-muted-foreground">วันที่รับสิทธิ์</p>
                              <p className="text-xs sm:text-sm break-words">{redeemDate}</p>
                            </div>
                            
                            {history.status === 'approved' && approvedDate && (
                              <div>
                                <p className="text-xs sm:text-sm text-muted-foreground">วันที่อนุมัติ</p>
                                <p className="text-xs sm:text-sm break-words">{approvedDate}</p>
                              </div>
                            )}
                            
                            {(shop.name || branch.name) && (
                              <div>
                                <p className="text-xs sm:text-sm text-muted-foreground">ร้าน/สาขา</p>
                                <p className="text-xs sm:text-sm break-words">
                                  {shop.name || ''}{shop.name && branch.name ? ' - ' : ''}{branch.name || ''}
                                </p>
                              </div>
                            )}
                            
                            {history.status === 'approved' && approvedByEmployee.name && (
                              <div>
                                <p className="text-xs sm:text-sm text-muted-foreground">อนุมัติโดย</p>
                                <p className="text-xs sm:text-sm break-words">{approvedByEmployee.name}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Content>
    </div>
  );
}

