'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, User, Gift, UserPlus, LogOut, ScanLine, CheckCircle } from 'lucide-react';
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
import { promotionHistoryApi, employeeApi, customerTokenLineApi, pointsApi, approvePromotionApi, customerNameApi, promotionNameApi } from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ApprovePromotionsPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [promotionHistory, setPromotionHistory] = useState([]);
  const [customerNames, setCustomerNames] = useState({}); // { customer_id: name }
  const [promotionNames, setPromotionNames] = useState({}); // { promotion_id: name }
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState({}); // Track which promotion is being approved

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      loadPendingPromotions();
    }
  }, [user]);

  // Load customer names and promotion names when promotionHistory changes
  useEffect(() => {
    if (promotionHistory.length > 0) {
      loadCustomerNames();
      loadPromotionNames();
    }
  }, [promotionHistory]);

  const loadUserData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);

        // Check if employee
        const userRole = userData.role || userData.user_type || 'customer';
        const isEmployee = userRole === 'employee';

        if (!isEmployee) {
          // Redirect non-employees to profile
          router.push('/crm-customer/profile');
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
    }
  };

  const loadCustomerNames = async () => {
    try {
      // ดึง customer_id จาก promotion-history
      const customerIds = [...new Set(promotionHistory.map(h => h.customer_id).filter(Boolean))];
      console.log('Loading customer names from promotion-history, customer_ids:', customerIds);
      
      const namePromises = customerIds.map(async (customerId) => {
        try {
          // เรียก API GET /api/customer-name?customer_id=xxx
          const data = await customerNameApi.get(customerId);
          const name = data?.name || '-';
          console.log(`Customer name loaded for ${customerId}:`, name);
          return { customerId, name };
        } catch (error) {
          console.error(`Failed to load customer name for ${customerId}:`, error);
          return { customerId, name: '-' };
        }
      });
      const names = await Promise.all(namePromises);
      const nameMap = {};
      names.forEach(({ customerId, name }) => {
        nameMap[customerId] = name;
      });
      setCustomerNames(nameMap);
    } catch (error) {
      console.error('Failed to load customer names:', error);
    }
  };

  const loadPromotionNames = async () => {
    try {
      const promotionIds = [...new Set(promotionHistory.map(h => h.promotion_id).filter(Boolean))];
      const namePromises = promotionIds.map(async (promotionId) => {
        try {
          const data = await promotionNameApi.get(promotionId);
          return { promotionId, name: data?.name || data?.name || '-' };
        } catch (error) {
          console.error(`Failed to load promotion name for ${promotionId}:`, error);
          return { promotionId, name: '-' };
        }
      });
      const names = await Promise.all(namePromises);
      const nameMap = {};
      names.forEach(({ promotionId, name }) => {
        nameMap[promotionId] = name;
      });
      setPromotionNames(nameMap);
    } catch (error) {
      console.error('Failed to load promotion names:', error);
    }
  };

  const loadPendingPromotions = async () => {
    try {
      setLoading(true);
      
      // Get employee shop_id and branch_id for filtering
      const displayUser = userDetails || user;
      const shopId = displayUser?.shop_id || localStorage.getItem('shop_id');
      const branchId = displayUser?.branch_id || localStorage.getItem('branch_id');

      if (!shopId) {
        toast.error('ไม่พบรหัสร้านค้า');
        setPromotionHistory([]);
        setLoading(false);
        return;
      }

      // Fetch promotion history with shop_id and branch_id
      const params = {};
      
      if (shopId) {
        params.shop_id = shopId;
      }
      if (branchId) {
        params.branch_id = branchId;
      }

      console.log('Loading promotions with params:', params);
      const data = await promotionHistoryApi.getAll(params);
      const historyList = Array.isArray(data) ? data : [];
      
      // Filter only pending status
      const pendingList = historyList.filter(item => item.status === 'pending');
      
      // Sort by created_at ascending (oldest first)
      pendingList.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateA - dateB;
      });
      
      setPromotionHistory(pendingList);
      console.log('Pending promotions loaded:', pendingList.length);
    } catch (error) {
      console.error('Failed to load pending promotions:', error);
      toast.error(error.message || 'ไม่สามารถโหลดรายการโปรโมชั่นได้');
      setPromotionHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (historyItem) => {
    const customerName = historyItem.customer_id 
      ? (customerNames[historyItem.customer_id] || historyItem.customer?.name || 'ลูกค้า')
      : (historyItem.customer?.name || 'ลูกค้า');
    const promotionName = historyItem.promotion_id
      ? (promotionNames[historyItem.promotion_id] || historyItem.promotion?.name || 'โปรโมชั่น')
      : (historyItem.promotion?.name || 'โปรโมชั่น');
    
    if (!confirm(`ยืนยันการอนุมัติโปรโมชั่น "${promotionName}" สำหรับลูกค้า "${customerName}"?`)) {
      return;
    }

    try {
      setApproving(prev => ({ ...prev, [historyItem.id]: true }));

      // Get shop_id and branch_id from employee
      const displayUser = userDetails || user;
      const shopId = displayUser?.shop_id || historyItem.shop_id || localStorage.getItem('shop_id');
      const branchId = displayUser?.branch_id || historyItem.branch_id || localStorage.getItem('branch_id');

      if (!shopId || !branchId) {
        toast.error('ไม่พบรหัสร้านค้าหรือสาขา');
        return;
      }

      // Approve promotion using new API
      await approvePromotionApi.approve({
        shop_id: shopId,
        branch_id: branchId,
        promotion_history_id: historyItem.id,
      });

      toast.success('อนุมัติโปรโมชั่นสำเร็จ');
      
      // Reload list
      await loadPendingPromotions();
    } catch (error) {
      console.error('Failed to approve promotion:', error);
      toast.error(error.message || 'ไม่สามารถอนุมัติโปรโมชั่นได้');
    } finally {
      setApproving(prev => {
        const newState = { ...prev };
        delete newState[historyItem.id];
        return newState;
      });
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

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header with Hamburger Menu */}
      <header className="sticky top-0 z-10 bg-background border-b border-border w-full">
        <div className="w-full mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">ยืนยันโปรโมชั่น</h1>
          
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
      </header>

      <Content className="block px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 w-full">
        <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {promotionHistory.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Gift className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
              <p className="text-base sm:text-lg text-muted-foreground">ไม่มีโปรโมชั่นที่รออนุมัติ</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {promotionHistory.map((history) => {
                // Get customer name from API
                const customerName = history.customer_id 
                  ? (customerNames[history.customer_id] || history.customer?.name || '-')
                  : (history.customer?.name || '-');
                
                // Get promotion name from API
                const promotionName = history.promotion_id
                  ? (promotionNames[history.promotion_id] || history.promotion?.name || 'โปรโมชั่น')
                  : (history.promotion?.name || 'โปรโมชั่น');
                
                const promotion = history.promotion || {};
                
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
                            <h3 className="text-lg sm:text-xl font-bold break-words">{promotionName}</h3>
                            <Badge variant="warning" appearance="light" size="sm">
                              รอดำเนินการ
                            </Badge>
                          </div>
                          
                          {promotion.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-4 break-words">
                              {promotion.description.replace(/<[^>]*>/g, '')}
                            </p>
                          )}
                          
                          <div className="space-y-2 mb-4">
                            <div>
                              <p className="text-xs sm:text-sm text-muted-foreground">ลูกค้า</p>
                              <p className="text-sm sm:text-base font-medium break-words">{customerName}</p>
                            </div>
                            
                            <div>
                              <p className="text-xs sm:text-sm text-muted-foreground">คะแนนที่ใช้</p>
                              <p className="text-sm sm:text-base font-medium">{history.points_used?.toLocaleString() || 0} คะแนน</p>
                            </div>
                            
                            <div>
                              <p className="text-xs sm:text-sm text-muted-foreground">วันที่รับสิทธิ์</p>
                              <p className="text-xs sm:text-sm break-words">{formatDate(history.created_at)}</p>
                            </div>
                          </div>
                          
                          <Button
                            onClick={() => handleApprove(history)}
                            disabled={approving[history.id]}
                            className="w-full sm:w-auto"
                          >
                            {approving[history.id] ? (
                              <>กำลังอนุมัติ...</>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                ยืนยัน
                              </>
                            )}
                          </Button>
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

