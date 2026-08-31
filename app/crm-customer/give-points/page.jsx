'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, User, UserPlus, LogOut, ScanLine, CheckCircle, Coins, Loader2 } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Content } from '@/components/layouts/crm/components/content';
import { toast } from 'sonner';
import { authApi, customerApi, employeeApi, pointsApi } from '@/lib/api';
import { getShopId } from '@/lib/utils';
import Link from 'next/link';

export default function GivePointsPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [points, setPoints] = useState('');
  const [detail, setDetail] = useState('');
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/crm-customer/login');
        return;
      }

      const userData = JSON.parse(userStr);
      setUser(userData);

      const userRole = userData.role || userData.user_type || 'customer';
      const isEmployee = userRole === 'employee' || userRole === 'adminshop' || userRole === 'admin';
      if (!isEmployee) {
        toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        router.push('/crm-customer/profile');
        return;
      }

      const lineToken = userData.line_token || localStorage.getItem('line_token');
      if (lineToken) {
        try {
          const employeeData = await employeeApi.getByLineToken(lineToken, getShopId());
          if (employeeData?.employee) {
            setUserDetails(employeeData.employee);
          }
        } catch (error) {
          console.error('Failed to load employee details:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const getSessionShopId = () =>
    userDetails?.shop_id || user?.shop_id || getShopId() || localStorage.getItem('shop_id') || '';

  const handleSearchCustomer = async () => {
    const trimmedPhone = phone.replace(/[\s-]/g, '').trim();
    if (!trimmedPhone) {
      toast.error('กรุณากรอกเบอร์โทรศัพท์ลูกค้า');
      return;
    }

    const shopId = getSessionShopId();
    if (!shopId) {
      toast.error('ไม่พบข้อมูลร้านค้าของพนักงาน');
      return;
    }

    try {
      setSearching(true);
      setFoundCustomer(null);
      const result = await customerApi.checkPhoneDuplicate(trimmedPhone, shopId);
      if (!result?.exists || !result?.customer) {
        toast.error('ไม่มีเบอร์โทรในระบบ');
        return;
      }
      setFoundCustomer(result.customer);
    } catch (error) {
      console.error('Failed to lookup customer phone:', error);
      toast.error(error.message || 'ไม่มีเบอร์โทรในระบบ');
      setFoundCustomer(null);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!foundCustomer?.id) {
      toast.error('กรุณาค้นหาเบอร์โทรศัพท์ลูกค้าก่อน');
      return;
    }

    const pointsValue = parseInt(points, 10);
    if (!pointsValue || pointsValue <= 0) {
      toast.error('กรุณากรอกคะแนนสะสม');
      return;
    }

    const trimmedDetail = detail.trim();
    if (!trimmedDetail) {
      toast.error('กรุณากรอกรายละเอียด');
      return;
    }

    try {
      setSaving(true);
      await pointsApi.addPoints(foundCustomer.id, {
        detail: trimmedDetail,
        points: pointsValue,
      });
      toast.success(`เพิ่ม ${pointsValue} คะแนนให้ ${foundCustomer.name || 'ลูกค้า'} แล้ว ลูกค้าได้รับทันที`);
      setPhone('');
      setPoints('');
      setDetail('');
      setFoundCustomer(null);
    } catch (error) {
      console.error('Failed to add points:', error);
      toast.error(error.message || 'ไม่สามารถเพิ่มคะแนนสะสมได้');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('shop_id');
      localStorage.removeItem('branch_id');

      if (typeof window !== 'undefined' && window.liff) {
        window.liff.logout();
      }

      toast.success('ออกจากระบบสำเร็จ');
      router.push('/crm-customer/login');
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  const displayUser = userDetails || user;
  const userName = displayUser?.name || user.name || 'ผู้ใช้งาน';
  const userAvatar = displayUser?.avatar_url || user.avatar_url || '';
  const userPhone = displayUser?.phone || user.phone || '';

  return (
    <div className="min-h-screen bg-background w-full">
      <header className="sticky top-0 z-10 bg-background border-b border-border w-full">
        <div className="w-full mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">ให้คะแนนสะสม</h1>

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
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{userPhone || 'พนักงาน'}</p>
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

                  <Link href="/crm-customer/give-points">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm sm:text-base"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Coins className="mr-2 h-4 w-4" />
                      ให้คะแนนสะสม
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
        <div className="container mx-auto max-w-2xl">
          <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm space-y-5">
            <div className="space-y-2">
              <Label htmlFor="customer-phone">เบอร์โทรศัพท์ลูกค้า *</Label>
              <div className="flex gap-2">
                <Input
                  id="customer-phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="08xxxxxxxx"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setFoundCustomer(null);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearchCustomer}
                  disabled={searching}
                >
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ค้นหา'}
                </Button>
              </div>
            </div>

            {foundCustomer && (
              <div className="rounded-lg bg-success/10 border border-success/20 p-3">
                <p className="text-sm text-muted-foreground">พบลูกค้า</p>
                <p className="font-semibold">{foundCustomer.name || '-'}</p>
                <p className="text-sm text-muted-foreground">{foundCustomer.phone}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="points">คะแนนสะสม *</Label>
              <Input
                id="points"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="0"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="detail">รายละเอียด *</Label>
              <Textarea
                id="detail"
                rows={3}
                placeholder="กรอกรายละเอียดคะแนนสะสม"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={saving || !foundCustomer}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                'บันทึกคะแนนสะสม'
              )}
            </Button>
          </form>
        </div>
      </Content>
    </div>
  );
}
