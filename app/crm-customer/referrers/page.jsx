'use client';

import { useState } from 'react';
import { Content } from '@/components/layouts/crm/components/content';
import ReferrersList from './referrers-list';
import { PageHeader } from './page-header';

export default function ReferrersPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <>
      <PageHeader onRefresh={handleRefresh} />
      <Content className="block py-0">
        <ReferrersList key={refreshKey} />
      </Content>
    </>
  );
}
