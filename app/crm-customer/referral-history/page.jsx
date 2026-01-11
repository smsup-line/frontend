'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Content } from '@/components/layouts/crm/components/content';
import ReferralHistoryList from './referral-history-list';
import { PageHeader } from './page-header';

export default function ReferralHistoryPage() {
  const searchParams = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [referrerId, setReferrerId] = useState(null);

  useEffect(() => {
    const refId = searchParams.get('referrer_id');
    setReferrerId(refId);
  }, [searchParams]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <>
      <PageHeader onRefresh={handleRefresh} referrerId={referrerId} />
      <Content className="block py-0">
        <ReferralHistoryList key={refreshKey} referrerId={referrerId} />
      </Content>
    </>
  );
}




