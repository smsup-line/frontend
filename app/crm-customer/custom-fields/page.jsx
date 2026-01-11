import { Content } from '@/components/layouts/crm/components/content';
import CustomFieldsList from './custom-fields-list';
import { PageHeader } from './page-header';

export default function CustomFieldsPage() {
  return (
    <>
      <PageHeader />
      <Content className="block py-0">
        <CustomFieldsList />
      </Content>
    </>
  );
}




