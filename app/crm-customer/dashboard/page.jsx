import { Content } from '@/components/layouts/crm/components/content';
import { PageHeader } from './page-header';

export default function DashboardPage() {
  return (
    <>
      <PageHeader />
      <Content className="block py-0">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
          <p className="text-muted-foreground">หน้า Dashboard กำลังพัฒนา...</p>
        </div>
      </Content>
    </>
  );
}




