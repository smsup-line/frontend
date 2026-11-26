'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { pointsApi } from '@/lib/api';

function ClaimPoints() {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get('code') || '';
  const [info, setInfo] = useState(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!code) return;
    pointsApi.getQR(code).then(setInfo).catch((error) => {
      toast.error(error.message || 'ไม่พบ QR นี้');
    });
  }, [code]);

  const claim = async () => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');
    if (!userStr || !token) {
      sessionStorage.setItem('post_login_next', `/crm-customer/claim-points?code=${encodeURIComponent(code)}`);
      const shop = info?.shop_id ? `?shop_id=${info.shop_id}` : '';
      router.push(`/crm-customer/login${shop}`);
      return;
    }
    try {
      setClaiming(true);
      const result = await pointsApi.claimQR(code);
      toast.success(`ได้รับ ${result.points} คะแนนแล้ว`);
      router.replace('/crm-customer/points-history');
    } catch (error) {
      toast.error(error.message || 'รับคะแนนไม่สำเร็จ');
    } finally {
      setClaiming(false);
    }
  };

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md space-y-3 text-center">
          <h1 className="text-xl font-bold">รับคะแนนจาก QR</h1>
          <p>ให้พนักงานเปิดหน้าให้คะแนนสะสม แล้วกดสร้าง QR จากนั้นสแกน QR นั้นด้วย LINE</p>
          <p className="text-sm text-muted-foreground">หน้านี้อยู่ที่ /crm-customer/claim-points และเปิดอัตโนมัติเมื่อสแกน QR</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 space-y-4 text-center">
        <h1 className="text-xl font-bold">รับคะแนนสะสม</h1>
        {!info ? (
          <p className="text-muted-foreground">กำลังโหลด...</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{info.shop_name}</p>
            <p className="text-4xl font-bold">{info.points}</p>
            <p>{info.detail}</p>
            {info.status !== 'ready' ? (
              <p className="text-destructive">{info.status === 'claimed' ? 'QR นี้ถูกใช้แล้ว' : 'QR นี้หมดอายุแล้ว'}</p>
            ) : (
              <Button className="w-full" onClick={claim} disabled={claiming}>
                {claiming ? 'กำลังรับคะแนน...' : 'รับคะแนน'}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ClaimPointsPage() {
  return (
    <Suspense fallback={<p className="p-6 text-center">กำลังโหลด...</p>}>
      <ClaimPoints />
    </Suspense>
  );
}
