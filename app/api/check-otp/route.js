import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// POST /api/check-otp - ตรวจสอบ OTP
export async function POST(request) {
  try {
    const body = await request.json();
    const { customer_id, otp } = body;
    
    if (!customer_id || !otp) {
      return NextResponse.json(
        { message: 'Missing customer_id or otp in request body' },
        { status: 400 }
      );
    }
    
    console.log('POST /api/check-otp');
    console.log('Customer ID:', customer_id);
    console.log('OTP:', otp);
    
    const response = await fetch(`${API_BASE_URL}/check-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id,
        otp,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to verify OTP' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Check OTP API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

