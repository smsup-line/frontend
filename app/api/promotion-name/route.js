import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// GET /api/promotion-name - ดึงชื่อโปรโมชั่น
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const promotionId = searchParams.get('promotion_id');
    
    if (!promotionId) {
      return NextResponse.json(
        { message: 'Missing promotion_id query parameter' },
        { status: 400 }
      );
    }
    
    console.log('GET /api/promotion-name');
    console.log('Promotion ID:', promotionId);
    
    const response = await fetch(`${API_BASE_URL}/promotion-name?promotion_id=${promotionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to fetch promotion name' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Promotion name API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

