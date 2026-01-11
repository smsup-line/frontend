import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// GET /api/promotions/:id - ดึงโปรโมชั่นตาม ID
export async function GET(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    const { id } = await params;
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { message: 'Invalid id parameter' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${API_BASE_URL}/promotions/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to fetch promotion' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get promotion API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

// PUT /api/promotions/:id - อัปเดตโปรโมชั่น
export async function PUT(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    const { id } = await params;
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { message: 'Invalid id parameter' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/promotions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to update promotion' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Update promotion API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

// DELETE /api/promotions/:id - ลบโปรโมชั่น
export async function DELETE(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    const { id } = await params;
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { message: 'Invalid id parameter' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${API_BASE_URL}/promotions/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to delete promotion' },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Delete promotion API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}
