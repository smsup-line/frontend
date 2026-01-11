import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(request, { params }) {
  console.log('=== GET CUSTOMER API CALLED ===');
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('NEXT_PUBLIC_API_URL env:', process.env.NEXT_PUBLIC_API_URL || 'not set');
  
  try {
    const authHeader = request.headers.get('authorization');
    const { id } = await params;
    
    const backendUrl = `${API_BASE_URL}/customers/${id}`;
    console.log('Backend URL:', backendUrl);
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { message: 'Invalid id parameter' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to fetch customer' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get customer API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

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
    
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
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
        { message: data.message || data.error || 'Failed to update customer' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Update customer API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

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
    
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to delete customer' },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Delete customer API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}



