import { Content } from '@/components/layouts/crm/components/content';
import AdminList from './admin-list';
import { PageHeader } from './page-header';

export default function AdminsPage() {
  return (
    <>
      <PageHeader />
      <Content className="block py-0">
        <AdminList />
      </Content>
    </>
  );
}




