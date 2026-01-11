import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// GET /api/menus/:id - ดึงเมนูตาม ID
export async function GET(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    const { id } = await params;
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { message: 'invalid id' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${API_BASE_URL}/menus/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to fetch menu' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get menu API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

// PUT /api/menus/:id - อัปเดตเมนู
export async function PUT(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    const { id } = await params;
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { message: 'invalid id' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/menus/${id}`, {
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
        { message: data.message || data.error || 'Failed to update menu' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Update menu API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

// DELETE /api/menus/:id - ลบเมนู
export async function DELETE(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    const { id } = await params;
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { message: 'invalid id' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${API_BASE_URL}/menus/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to delete menu' },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Delete menu API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}


