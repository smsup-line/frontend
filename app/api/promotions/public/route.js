import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// GET /api/promotions/public - ดึงรายการโปรโมชั่นสาธารณะ (ไม่ต้อง authentication)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop_id');
    const branchId = searchParams.get('branch_id');
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (shopId) {
      queryParams.append('shop_id', shopId);
    }
    if (branchId) {
      queryParams.append('branch_id', branchId);
    }
    
    const queryString = queryParams.toString();
    const url = queryString 
      ? `${API_BASE_URL}/promotions/public?${queryString}`
      : `${API_BASE_URL}/promotions/public`;
    
    console.log('Fetching public promotions from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      console.error('Public promotions API error:', response.status, data);
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to fetch promotions' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Public promotions response:', Array.isArray(data) ? `${data.length} promotions` : 'invalid format');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Public promotions API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}


