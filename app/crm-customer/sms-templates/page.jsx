import { Content } from '@/components/layouts/crm/components/content';
import SmsTemplatesList from './sms-templates-list';
import { PageHeader } from './page-header';

export default function SmsTemplatesPage() {
  return (
    <>
      <PageHeader />
      <Content className="block py-0">
        <SmsTemplatesList />
      </Content>
    </>
  );
}




