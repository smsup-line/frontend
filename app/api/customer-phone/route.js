import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// PUT /api/customer-phone - แก้ไขเบอร์โทรศัพท์ลูกค้า
export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    
    const { customer_id, phone } = body;
    
    if (!customer_id) {
      return NextResponse.json(
        { message: 'Missing customer_id' },
        { status: 400 }
      );
    }
    
    if (!phone) {
      return NextResponse.json(
        { message: 'Missing phone' },
        { status: 400 }
      );
    }
    
    console.log('PUT /api/customer-phone');
    console.log('Customer ID:', customer_id);
    console.log('Phone:', phone);
    
    const response = await fetch(`${API_BASE_URL}/customer-phone`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify({
        customer_id,
        phone,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to update customer phone' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Update customer phone API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// PUT /api/customer-phone - แก้ไขเบอร์โทรศัพท์ลูกค้า
export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    
    const { customer_id, phone } = body;
    
    if (!customer_id) {
      return NextResponse.json(
        { message: 'Missing customer_id' },
        { status: 400 }
      );
    }
    
    if (!phone) {
      return NextResponse.json(
        { message: 'Missing phone' },
        { status: 400 }
      );
    }
    
    console.log('PUT /api/customer-phone');
    console.log('Customer ID:', customer_id);
    console.log('Phone:', phone);
    
    const response = await fetch(`${API_BASE_URL}/customer-phone`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify({
        customer_id,
        phone,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to update customer phone' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Update customer phone API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// PUT /api/customer-phone - แก้ไขเบอร์โทรศัพท์ลูกค้า
export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    
    const { customer_id, phone } = body;
    
    if (!customer_id) {
      return NextResponse.json(
        { message: 'Missing customer_id' },
        { status: 400 }
      );
    }
    
    if (!phone) {
      return NextResponse.json(
        { message: 'Missing phone' },
        { status: 400 }
      );
    }
    
    console.log('PUT /api/customer-phone');
    console.log('Customer ID:', customer_id);
    console.log('Phone:', phone);
    
    const response = await fetch(`${API_BASE_URL}/customer-phone`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify({
        customer_id,
        phone,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to update customer phone' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Update customer phone API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

