'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Check,
  ChevronDown,
  Crown,
  LogOut,
  Moon,
  PanelRightOpen,
  Plus,
  Settings,
  Sun,
  User } from
'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
'@/components/ui/dropdown-menu';
import { useLayout } from './layout-context';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';







const mockWorkspaces = [
{
  id: '1',
  name: 'Keenthemes',
  state: 'bg-emerald-500',
  isCurrent: true
},
{
  id: '2',
  name: 'Studio',
  state: 'bg-indigo-500',
  isCurrent: false
},
{
  id: '3',
  name: 'ReUI',
  state: 'bg-pink-500',
  isCurrent: false
}];


export function SidebarDefaultHeader() {
  const { sidebarCollapse, setSidebarCollapse } = useLayout();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // โหลดข้อมูลผู้ใช้จาก localStorage
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);
        } catch (e) {
          console.error('Failed to parse user data:', e);
        }
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      // เรียก logout API
      await authApi.logout();
    } catch (error) {
      console.error('Logout API error:', error);
      // แม้ว่า API จะ error ก็ยัง logout ต่อ (ลบข้อมูลใน localStorage)
    } finally {
      // ลบข้อมูลจาก localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('remember_me');
      
      toast.success('ออกจากระบบสำเร็จ');
      
      // Redirect ไปหน้า login
      router.push('/crm-customer/login');
    }
  };

  // สร้าง initial จาก username หรือใช้ค่า default
  const getInitial = () => {
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = () => {
    if (user?.username) {
      return user.username;
    }
    return 'ผู้ใช้';
  };

  return (
    <div className="group flex justify-between items-center gap-2.5 border-b border-border h-11 lg:h-(--sidebar-header-height) shrink-0 px-2.5">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center justify-between gap-2.5 px-1.5 hover:bg-accent -ms-0.5">

              <span className="rounded-md bg-emerald-500 text-white text-sm shrink-0 size-6 flex items-center justify-center">
                {getInitial()}
              </span>
              <span className="text-foreground text-sm font-medium in-data-[sidebar-collapsed]:hidden">
                {getUserDisplayName()}
              </span>
              <ChevronDown className="size-4 text-muted-foreground in-data-[sidebar-collapsed]:hidden" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64"
            side="bottom"
            align="start"
            sideOffset={7}
            alignOffset={0}>

            {/* Account Section */}
            <DropdownMenuLabel>บัญชีผู้ใช้งาน</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Settings className="size-4" />
                <Link href="/crm-customer/settings"><span>ตั้งค่าระบบร้านค้า</span></Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Crown className="size-4" />
                <span>ต่ออายุแพ็คเกจ</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Crown className="size-4" />
                <span>เติมเครดิตSMS</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="size-4" />
                <span>ออกจากระบบ</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>

              {theme === 'dark' ?
              <Sun className="size-4" /> :

              <Moon className="size-4" />
              }
              <span>{theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Button
        variant="ghost"
        mode="icon"
        className="hidden lg:group-hover:flex lg:in-data-[sidebar-collapsed]:hidden!"
        onClick={() => setSidebarCollapse(!sidebarCollapse)}>

        <PanelRightOpen className="size-4" />
      </Button>
    </div>);

}