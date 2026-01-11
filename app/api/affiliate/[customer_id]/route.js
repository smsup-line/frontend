import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    const { customer_id } = await params;
    
    // Validate customer_id
    if (!customer_id || customer_id === 'undefined' || customer_id.trim() === '') {
      return NextResponse.json(
        { message: 'invalid customer_id' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${API_BASE_URL}/affiliate/${customer_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to fetch affiliate data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Affiliate API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}




