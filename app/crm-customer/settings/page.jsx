import { Content } from '@/components/layouts/crm/components/content';
import SettingsForm from './settings-form';
import { PageHeader } from './page-header';

export default function SettingsPage() {
  return (
    <>
      <PageHeader />
      <Content className="block py-0">
        <SettingsForm />
      </Content>
    </>
  );
}




