import { Content } from '@/components/layouts/crm/components/content';
import BranchList from './branch-list';
import { PageHeader } from './page-header';

export default function BranchesPage() {
  return (
    <>
      <PageHeader />
      <Content className="block py-0">
        <BranchList />
      </Content>
    </>
  );
}




