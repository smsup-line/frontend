import { Content } from '@/components/layouts/crm/components/content';
import CustomerList from './customer-list';
import { PageHeader } from './page-header';

export default function CustomersPage() {
  return (
    <>
      <PageHeader />
      <Content className="block py-0">
        <CustomerList />
      </Content>
    </>
  );
}




