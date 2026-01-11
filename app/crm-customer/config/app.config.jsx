import {
  LayoutDashboard,
  Store,
  GitBranch,
  UserCog,
  Users,
  Coins,
  FileText,
  MessageSquare,
  Settings,
  ScanLine,
  UserPlus,
  Gift,
  History,
  Menu,
  Package,
} from 'lucide-react';

export const CRM_CUSTOMER_NAV = [
  {
    title: 'หน้าหลัก',
    icon: LayoutDashboard,
    path: '/crm-customer/dashboard',
    id: 'dashboard',
    pinnable: true,
    pinned: true,
  },
  {
    title: 'จัดการร้านค้า',
    icon: Store,
    path: '/crm-customer/stores',
    id: 'stores',
    pinnable: true,
    pinned: true,
    requiredRole: 'superadmin', // เฉพาะ superadmin เท่านั้น
    new: {
      tooltip: 'เพิ่มร้านค้า',
      path: '/crm-customer/stores'
    }
  },
  {
    title: 'จัดการสาขา',
    icon: GitBranch,
    path: '/crm-customer/branches',
    id: 'branches',
    pinnable: true,
    pinned: true,
    new: {
      tooltip: 'เพิ่มสาขา',
      path: '/crm-customer/branches'
    }
  },
  {
    title: 'จัดการผู้ดูแลระบบ',
    icon: UserCog,
    path: '/crm-customer/admins',
    id: 'admins',
    pinnable: true,
    pinned: true,
    requiredRole: 'superadmin', // เฉพาะ superadmin เท่านั้น
    new: {
      tooltip: 'เพิ่มผู้ดูแลระบบ',
      path: '/crm-customer/admins'
    }
  },
  {
    title: 'จัดการลูกค้า',
    icon: Users,
    path: '/crm-customer/customers',
    id: 'customers',
    pinnable: true,
    pinned: true,
    new: {
      tooltip: 'เพิ่มลูกค้า',
      path: '/crm-customer/customers'
    }
  },
  {
    title: 'คะแนนสะสม',
    icon: Coins,
    path: '/crm-customer/points-history',
    id: 'points-history',
    pinnable: true,
    pinned: true
  },
  {
    title: 'Custom Fields',
    icon: FileText,
    path: '/crm-customer/custom-fields',
    id: 'custom-fields',
    pinnable: true,
    pinned: true,
    new: {
      tooltip: 'เพิ่ม Custom Field',
      path: '/crm-customer/custom-fields'
    }
  },
  {
    title: 'SMS Template',
    icon: MessageSquare,
    path: '/crm-customer/sms-templates',
    id: 'sms-templates',
    pinnable: true,
    pinned: true,
    new: {
      tooltip: 'เพิ่ม SMS Template',
      path: '/crm-customer/sms-templates'
    }
  },
  {
    title: 'แสกนใบเสร็จรับเงิน',
    icon: ScanLine,
    path: '/crm-customer/receipt-scanner',
    id: 'receipt-scanner',
    pinnable: true,
    pinned: true,
  },
  {
    title: 'แนะนำเพื่อน',
    icon: UserPlus,
    path: '/crm-customer/referrers',
    id: 'referrers',
    pinnable: true,
    pinned: true,
    requiredRole: 'superadmin', // เฉพาะ superadmin เท่านั้น
  },
  {
    title: 'โปรโมชั่น',
    icon: Gift,
    path: '/crm-customer/promotions',
    id: 'promotions',
    pinnable: true,
    pinned: true,
    new: {
      tooltip: 'เพิ่มโปรโมชั่น',
      path: '/crm-customer/promotions'
    }
  },
  {
    title: 'ประวัติการใช้โปรโมชั่น',
    icon: History,
    path: '/crm-customer/promotion-history',
    id: 'promotion-history',
    pinnable: true,
    pinned: true,
    new: {
      tooltip: 'เพิ่มประวัติการใช้โปรโมชั่น',
      path: '/crm-customer/promotion-history'
    }
  },
  {
    title: 'เมนู',
    icon: Menu,
    path: '/crm-customer/menus',
    id: 'menus',
    pinnable: true,
    pinned: true,
    requiredRole: 'superadmin', // เฉพาะ superadmin เท่านั้น
    new: {
      tooltip: 'เพิ่มเมนู',
      path: '/crm-customer/menus'
    }
  },
  {
    title: 'แพ็คเกจ',
    icon: Package,
    path: '/crm-customer/packages',
    id: 'packages',
    pinnable: true,
    pinned: true,
    requiredRole: 'superadmin', // เฉพาะ superadmin เท่านั้น
    new: {
      tooltip: 'เพิ่มแพ็คเกจ',
      path: '/crm-customer/packages'
    }
  },
  {
    title: 'ประวัติการต่ออายุแพ็คเกจ',
    icon: History,
    path: '/crm-customer/package-renewal-history',
    id: 'package-renewal-history',
    pinnable: true,
    pinned: true,
    requiredRole: 'superadmin', // เฉพาะ superadmin เท่านั้น
    new: {
      tooltip: 'เพิ่มประวัติการต่ออายุ',
      path: '/crm-customer/package-renewal-history'
    }
  },
  {
    title: 'ตั้งค่าระบบร้านค้า',
    icon: Settings,
    path: '/crm-customer/settings',
    id: 'settings',
    pinnable: true,
    pinned: true,
  },
  {
    title: 'ตั้งค่าระบบส่วนกลาง',
    icon: Settings,
    path: '/crm-customer/settings-center',
    id: 'settings-center',
    pinnable: true,
    pinned: true,
    requiredRole: 'superadmin', // เฉพาะ superadmin เท่านั้น
  }
];
