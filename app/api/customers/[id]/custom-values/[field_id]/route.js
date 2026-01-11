import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// PUT /api/customers/:id/custom-values/:field_id - UpdateCustomerCustomValue
export async function PUT(request, { params }) {
  try {
    const { id, field_id } = await params;
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { message: 'Invalid id parameter' },
        { status: 400 }
      );
    }
    
    if (!field_id || typeof field_id !== 'string') {
      return NextResponse.json(
        { message: 'Invalid field_id parameter' },
        { status: 400 }
      );
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error('Invalid UUID format for id:', id);
      return NextResponse.json(
        { message: 'Invalid id format. Expected UUID.' },
        { status: 400 }
      );
    }
    
    if (!uuidRegex.test(field_id)) {
      console.error('Invalid UUID format for field_id:', field_id);
      return NextResponse.json(
        { message: 'Invalid field_id format. Expected UUID.' },
        { status: 400 }
      );
    }
    
    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/customers/${id}/custom-values/${field_id}`, {
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
        { message: data.message || data.error || 'Failed to update customer custom value' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Update customer custom value API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/:id/custom-values/:field_id - DeleteCustomerCustomValue
export async function DELETE(request, { params }) {
  try {
    const { id, field_id } = await params;
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { message: 'Invalid id parameter' },
        { status: 400 }
      );
    }
    
    if (!field_id || typeof field_id !== 'string') {
      return NextResponse.json(
        { message: 'Invalid field_id parameter' },
        { status: 400 }
      );
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error('Invalid UUID format for id:', id);
      return NextResponse.json(
        { message: 'Invalid id format. Expected UUID.' },
        { status: 400 }
      );
    }
    
    if (!uuidRegex.test(field_id)) {
      console.error('Invalid UUID format for field_id:', field_id);
      return NextResponse.json(
        { message: 'Invalid field_id format. Expected UUID.' },
        { status: 400 }
      );
    }
    
    const authHeader = request.headers.get('authorization');
    
    const response = await fetch(`${API_BASE_URL}/customers/${id}/custom-values/${field_id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to delete customer custom value' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Delete customer custom value API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

