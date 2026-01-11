import { Content } from '@/components/layouts/crm/components/content';
import SettingsCenterForm from './settings-center-form';
import { PageHeader } from './page-header';

export default function SettingsCenterPage() {
  return (
    <>
      <PageHeader />
      <Content className="block py-0">
        <SettingsCenterForm />
      </Content>
    </>
  );
}


