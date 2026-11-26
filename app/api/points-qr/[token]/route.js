import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

export async function GET(_request, { params }) {
  try {
    const { token } = await params;
    const response = await fetch(`${API_BASE_URL}/points-qr/${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: 'ไม่สามารถเชื่อมต่อ API ได้' }, { status: 500 });
  }
}
