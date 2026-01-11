'use client';

import { Suspense, useState } from 'react';
import { Content } from '@/components/layouts/crm/components/content';
import PromotionHistoryList from './promotion-history-list';
import { PageHeader } from './page-header';

function PromotionHistoryContent() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <PageHeader onRefresh={() => setRefreshKey(prev => prev + 1)} />
      <Content className="block py-0">
        <PromotionHistoryList key={refreshKey} />
      </Content>
    </>
  );
}

export default function PromotionHistoryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PromotionHistoryContent />
    </Suspense>
  );
}

