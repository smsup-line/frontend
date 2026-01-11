import { Content } from '@/components/layouts/crm/components/content';
import StoreList from './store-list';
import { PageHeader } from './page-header';

export default function StoresPage() {
  return (
    <>
      <PageHeader />
      <Content className="block py-0">
        <StoreList />
      </Content>
    </>
  );
}




