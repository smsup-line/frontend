import { NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';
const DEFAULT_TIMEOUT = 10000;

export async function GET(request) {
  try {
    const shopId = new URL(request.url).searchParams.get('shop_id');
    if (!shopId || !String(shopId).trim()) {
      return NextResponse.json({ message: 'shop_id is required' }, { status: 400 });
    }

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/shops/resolve?shop_id=${encodeURIComponent(String(shopId).trim())}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      DEFAULT_TIMEOUT
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to resolve shop' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Resolve shop API error:', error);
    return NextResponse.json({ message: 'ไม่สามารถเชื่อมต่อ API ได้' }, { status: 500 });
  }
}
