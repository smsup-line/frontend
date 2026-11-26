'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { pointsApi } from '@/lib/api';

function tokenFromScan(text) {
  const raw = String(text || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    const code = url.searchParams.get('code');
    if (code) return code;
  } catch {
    // not a URL
  }
  const match = raw.match(/[?&]code=([a-f0-9]+)/i);
  if (match) return match[1];
  if (/^[a-f0-9]{32}$/i.test(raw)) return raw;
  return '';
}

function loadScript(id, src) {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id);
    if (existing) {
      if (existing.getAttribute('data-loaded') === '1') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('load failed')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.setAttribute('data-loaded', '1');
      resolve();
    };
    script.onerror = () => reject(new Error('load failed'));
    document.body.appendChild(script);
  });
}

function ClaimPoints() {
  const router = useRouter();
  const params = useSearchParams();
  const initialCode = params.get('code') || '';
  const [code, setCode] = useState(initialCode);
  const [info, setInfo] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [scanning, setScanning] = useState(!initialCode);
  const scannerRef = useRef(null);
  const handledRef = useRef(false);

  useEffect(() => {
    if (!code) return;
    setInfo(null);
    pointsApi.getQR(code).then(setInfo).catch((error) => {
      toast.error(error.message || 'ไม่พบ QR นี้');
    });
  }, [code]);

  useEffect(() => {
    if (!scanning) return undefined;
    let stopped = false;
    handledRef.current = false;

    const onScan = (text) => {
      if (handledRef.current) return;
      const next = tokenFromScan(text);
      if (!next) {
        toast.error('QR นี้ไม่ใช่รหัสรับคะแนน');
        return;
      }
      handledRef.current = true;
      setCode(next);
      setScanning(false);
    };

    const start = async () => {
      try {
        await loadScript('html5-qrcode-script', 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js');
        if (stopped || !window.Html5Qrcode) return;
        const scanner = new window.Html5Qrcode('points-qr-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          onScan,
          () => {}
        );
      } catch (error) {
        console.error(error);
        if (!stopped) toast.error('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการเข้าถึงกล้อง');
      }
    };

    start();

    return () => {
      stopped = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        scanner.stop().catch(() => {}).finally(() => {
          scanner.clear().catch(() => {});
        });
      }
    };
  }, [scanning]);

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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background">
        <div className="mx-auto flex h-14 max-w-md items-center px-4">
          <button type="button" className="text-sm text-primary" onClick={() => router.push('/crm-customer/profile')}>
            กลับ
          </button>
          <h1 className="flex-1 text-center text-base font-semibold">รับคะแนนสะสม</h1>
          <span className="w-8" />
        </div>
      </header>
      <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6 text-center">
        {scanning ? (
          <>
            <p className="text-sm text-muted-foreground">ส่องกล้องไปที่ QR ที่พนักงานสร้าง</p>
            <div id="points-qr-reader" className="points-qr-reader overflow-hidden rounded-xl bg-black" />
          </>
        ) : !info ? (
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
            <Button type="button" variant="outline" className="w-full" onClick={() => { setCode(''); setInfo(null); setScanning(true); }}>
              สแกน QR อื่น
            </Button>
          </>
        )}
      </div>
      <style>{`
        .points-qr-reader video {
          width: 100% !important;
          height: auto !important;
          border-radius: 12px;
          object-fit: cover;
        }
        .points-qr-reader img { display: none !important; }
        #points-qr-reader__dashboard_section,
        #points-qr-reader__dashboard,
        #points-qr-reader__header_message { display: none !important; }
      `}</style>
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
