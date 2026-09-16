import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

export async function GET(_request, { params }) {
  try {
    const { shop_id } = await params;
    if (!shop_id || shop_id === 'undefined' || String(shop_id).trim() === '') {
      return NextResponse.json({ message: 'invalid shop_id' }, { status: 400 });
    }

    const response = await fetch(
      `${API_BASE_URL}/shops/${encodeURIComponent(shop_id)}/line-login-config`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to fetch LINE login config' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('LINE login config proxy error:', error);
    return NextResponse.json({ message: 'ไม่สามารถเชื่อมต่อ API ได้' }, { status: 500 });
  }
}
