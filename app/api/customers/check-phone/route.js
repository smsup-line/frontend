import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const storeId = searchParams.get('storeId');
    const branchId = searchParams.get('branchId');
    
    const queryParams = new URLSearchParams();
    if (phone) queryParams.append('phone', phone);
    if (storeId) queryParams.append('storeId', storeId);
    if (branchId) queryParams.append('branchId', branchId);
    
    const queryString = queryParams.toString();
    const url = queryString 
      ? `${API_BASE_URL}/customers/check-phone?${queryString}`
      : `${API_BASE_URL}/customers/check-phone`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to check phone' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Check phone API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}




