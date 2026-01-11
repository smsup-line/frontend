import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// DELETE /api/customers/:id/points/:points_id - ลบประวัติคะแนนสะสม
export async function DELETE(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    const { id, points_id } = await params;
    
    // Validate id
    if (!id || id === 'undefined' || id.trim() === '') {
      return NextResponse.json(
        { message: 'invalid id' },
        { status: 400 }
      );
    }
    
    // Validate points_id
    if (!points_id || points_id === 'undefined' || points_id.trim() === '') {
      return NextResponse.json(
        { message: 'invalid points_id' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${API_BASE_URL}/customers/${id}/points/${points_id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to delete customer points history' },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Delete customer points history API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}


