import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// GET /api/receipt-scanner-customer - ดึงรายการสแกนใบเสร็จของลูกค้า
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    
    if (!customerId) {
      return NextResponse.json(
        { message: 'Missing customer_id query parameter' },
        { status: 400 }
      );
    }
    
    console.log('GET /api/receipt-scanner-customer');
    console.log('Customer ID:', customerId);
    
    const response = await fetch(`${API_BASE_URL}/receipt-scanner-customer?customer_id=${customerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to fetch customer receipts' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Receipt scanner customer API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

