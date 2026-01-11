'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, UserPlus, QrCode, Download, Copy, Check, User, CheckCircle, ScanLine, LogOut } from 'lucide-react';
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
import { authApi } from '@/lib/api';
import Link from 'next/link';

// Generate QR code using external API
function getQRCodeUrl(text) {
  // Use a free QR code API
  const encodedText = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodedText}`;
}

export default function AddCustomerPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (qrUrl) {
      setQrImageUrl(getQRCodeUrl(qrUrl));
    }
  }, [qrUrl]);

  const loadUserData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);

        // Generate QR code URL with shop_id and branch_id
        const shopId = userData.shop_id || localStorage.getItem('shop_id') || '';
        const branchId = userData.branch_id || localStorage.getItem('branch_id') || '';
        
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const loginUrl = `${baseUrl}/crm-customer/login?shop_id=${shopId}${branchId ? `&branch_id=${branchId}` : ''}`;
        setQrUrl(loginUrl);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
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

  const handleDownloadQR = async () => {
    if (!qrImageUrl) return;

    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'customer-login-qr.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('ดาวน์โหลด QR Code สำเร็จ');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('ไม่สามารถดาวน์โหลด QR Code ได้');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      toast.success('คัดลอกลิงก์สำเร็จ');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('ไม่สามารถคัดลอกลิงก์ได้');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  const userName = user.name || 'ผู้ใช้งาน';
  const userAvatar = user.avatar_url || '';
  const userRole = user.role || 'employee';
  const isEmployee = userRole === 'employee';

  if (!isEmployee) {
    router.push('/crm-customer/profile');
    return null;
  }

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header with Hamburger Menu */}
      <header className="sticky top-0 z-10 bg-background border-b border-border w-full">
        <div className="w-full mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">เพิ่มลูกค้า</h1>
          
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
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">พนักงาน</p>
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

      {/* Content */}
      <Content className="block px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 w-full">
        <div className="container mx-auto max-w-2xl">
          <div className="space-y-6">
            {/* QR Code Card */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <QrCode className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold">QR Code สำหรับลูกค้า Login</h2>
                <p className="text-sm text-muted-foreground text-center">
                  ให้ลูกค้าสแกน QR Code นี้เพื่อเข้าสู่ระบบด้วย LINE Login
                </p>
                
                {/* QR Code Image */}
                {qrImageUrl && (
                  <div className="p-4 bg-white rounded-lg border border-border">
                    <img
                      src={qrImageUrl}
                      alt="QR Code"
                      className="w-64 h-64"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 w-full max-w-sm">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleDownloadQR}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    ดาวน์โหลด
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        คัดลอกแล้ว
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        คัดลอกลิงก์
                      </>
                    )}
                  </Button>
                </div>

                {/* Link Display */}
                <div className="w-full max-w-sm">
                  <p className="text-xs text-muted-foreground mb-2">ลิงก์สำหรับ Login:</p>
                  <div className="p-3 bg-muted rounded-lg break-all text-xs font-mono">
                    {qrUrl}
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">วิธีใช้งาน</h3>
              <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
                <li>แสดง QR Code นี้ให้ลูกค้าสแกน</li>
                <li>ลูกค้าจะถูกนำไปหน้า Login ด้วย LINE</li>
                <li>หลังจาก Login สำเร็จ ลูกค้าจะถูกเพิ่มเข้า系統อัตโนมัติ</li>
                <li>ลูกค้าจะต้องกรอกเบอร์โทรศัพท์และยืนยัน OTP</li>
              </ol>
            </div>
          </div>
        </div>
      </Content>
    </div>
  );
}


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, UserPlus, QrCode, Download, Copy, Check, User, CheckCircle, ScanLine, LogOut } from 'lucide-react';
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
import { authApi } from '@/lib/api';
import Link from 'next/link';

// Generate QR code using external API
function getQRCodeUrl(text) {
  // Use a free QR code API
  const encodedText = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodedText}`;
}

export default function AddCustomerPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (qrUrl) {
      setQrImageUrl(getQRCodeUrl(qrUrl));
    }
  }, [qrUrl]);

  const loadUserData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);

        // Generate QR code URL with shop_id and branch_id
        const shopId = userData.shop_id || localStorage.getItem('shop_id') || '';
        const branchId = userData.branch_id || localStorage.getItem('branch_id') || '';
        
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const loginUrl = `${baseUrl}/crm-customer/login?shop_id=${shopId}${branchId ? `&branch_id=${branchId}` : ''}`;
        setQrUrl(loginUrl);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
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

  const handleDownloadQR = async () => {
    if (!qrImageUrl) return;

    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'customer-login-qr.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('ดาวน์โหลด QR Code สำเร็จ');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('ไม่สามารถดาวน์โหลด QR Code ได้');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      toast.success('คัดลอกลิงก์สำเร็จ');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('ไม่สามารถคัดลอกลิงก์ได้');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  const userName = user.name || 'ผู้ใช้งาน';
  const userAvatar = user.avatar_url || '';
  const userRole = user.role || 'employee';
  const isEmployee = userRole === 'employee';

  if (!isEmployee) {
    router.push('/crm-customer/profile');
    return null;
  }

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header with Hamburger Menu */}
      <header className="sticky top-0 z-10 bg-background border-b border-border w-full">
        <div className="w-full mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">เพิ่มลูกค้า</h1>
          
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
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">พนักงาน</p>
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

      {/* Content */}
      <Content className="block px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 w-full">
        <div className="container mx-auto max-w-2xl">
          <div className="space-y-6">
            {/* QR Code Card */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <QrCode className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold">QR Code สำหรับลูกค้า Login</h2>
                <p className="text-sm text-muted-foreground text-center">
                  ให้ลูกค้าสแกน QR Code นี้เพื่อเข้าสู่ระบบด้วย LINE Login
                </p>
                
                {/* QR Code Image */}
                {qrImageUrl && (
                  <div className="p-4 bg-white rounded-lg border border-border">
                    <img
                      src={qrImageUrl}
                      alt="QR Code"
                      className="w-64 h-64"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 w-full max-w-sm">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleDownloadQR}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    ดาวน์โหลด
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        คัดลอกแล้ว
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        คัดลอกลิงก์
                      </>
                    )}
                  </Button>
                </div>

                {/* Link Display */}
                <div className="w-full max-w-sm">
                  <p className="text-xs text-muted-foreground mb-2">ลิงก์สำหรับ Login:</p>
                  <div className="p-3 bg-muted rounded-lg break-all text-xs font-mono">
                    {qrUrl}
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">วิธีใช้งาน</h3>
              <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
                <li>แสดง QR Code นี้ให้ลูกค้าสแกน</li>
                <li>ลูกค้าจะถูกนำไปหน้า Login ด้วย LINE</li>
                <li>หลังจาก Login สำเร็จ ลูกค้าจะถูกเพิ่มเข้า系統อัตโนมัติ</li>
                <li>ลูกค้าจะต้องกรอกเบอร์โทรศัพท์และยืนยัน OTP</li>
              </ol>
            </div>
          </div>
        </div>
      </Content>
    </div>
  );
}


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, UserPlus, QrCode, Download, Copy, Check, User, CheckCircle, ScanLine, LogOut } from 'lucide-react';
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
import { authApi } from '@/lib/api';
import Link from 'next/link';

// Generate QR code using external API
function getQRCodeUrl(text) {
  // Use a free QR code API
  const encodedText = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodedText}`;
}

export default function AddCustomerPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (qrUrl) {
      setQrImageUrl(getQRCodeUrl(qrUrl));
    }
  }, [qrUrl]);

  const loadUserData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);

        // Generate QR code URL with shop_id and branch_id
        const shopId = userData.shop_id || localStorage.getItem('shop_id') || '';
        const branchId = userData.branch_id || localStorage.getItem('branch_id') || '';
        
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const loginUrl = `${baseUrl}/crm-customer/login?shop_id=${shopId}${branchId ? `&branch_id=${branchId}` : ''}`;
        setQrUrl(loginUrl);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
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

  const handleDownloadQR = async () => {
    if (!qrImageUrl) return;

    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'customer-login-qr.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('ดาวน์โหลด QR Code สำเร็จ');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('ไม่สามารถดาวน์โหลด QR Code ได้');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      toast.success('คัดลอกลิงก์สำเร็จ');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('ไม่สามารถคัดลอกลิงก์ได้');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  const userName = user.name || 'ผู้ใช้งาน';
  const userAvatar = user.avatar_url || '';
  const userRole = user.role || 'employee';
  const isEmployee = userRole === 'employee';

  if (!isEmployee) {
    router.push('/crm-customer/profile');
    return null;
  }

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header with Hamburger Menu */}
      <header className="sticky top-0 z-10 bg-background border-b border-border w-full">
        <div className="w-full mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">เพิ่มลูกค้า</h1>
          
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
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">พนักงาน</p>
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

      {/* Content */}
      <Content className="block px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 w-full">
        <div className="container mx-auto max-w-2xl">
          <div className="space-y-6">
            {/* QR Code Card */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <QrCode className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold">QR Code สำหรับลูกค้า Login</h2>
                <p className="text-sm text-muted-foreground text-center">
                  ให้ลูกค้าสแกน QR Code นี้เพื่อเข้าสู่ระบบด้วย LINE Login
                </p>
                
                {/* QR Code Image */}
                {qrImageUrl && (
                  <div className="p-4 bg-white rounded-lg border border-border">
                    <img
                      src={qrImageUrl}
                      alt="QR Code"
                      className="w-64 h-64"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 w-full max-w-sm">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleDownloadQR}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    ดาวน์โหลด
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        คัดลอกแล้ว
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        คัดลอกลิงก์
                      </>
                    )}
                  </Button>
                </div>

                {/* Link Display */}
                <div className="w-full max-w-sm">
                  <p className="text-xs text-muted-foreground mb-2">ลิงก์สำหรับ Login:</p>
                  <div className="p-3 bg-muted rounded-lg break-all text-xs font-mono">
                    {qrUrl}
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">วิธีใช้งาน</h3>
              <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
                <li>แสดง QR Code นี้ให้ลูกค้าสแกน</li>
                <li>ลูกค้าจะถูกนำไปหน้า Login ด้วย LINE</li>
                <li>หลังจาก Login สำเร็จ ลูกค้าจะถูกเพิ่มเข้า系統อัตโนมัติ</li>
                <li>ลูกค้าจะต้องกรอกเบอร์โทรศัพท์และยืนยัน OTP</li>
              </ol>
            </div>
          </div>
        </div>
      </Content>
    </div>
  );
}

