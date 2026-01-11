import { Layout } from './components/layout';

// DefaultLayout ไม่ควรสร้าง LayoutProvider ใหม่
// เพราะ LayoutProvider ถูกสร้างใน CrmCustomerLayout แล้ว
// ใช้ Layout โดยตรง
export function DefaultLayout({ children }) {
  return <Layout>{children}</Layout>;
}