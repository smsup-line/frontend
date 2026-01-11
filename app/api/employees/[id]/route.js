import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(request, { params }) {
  console.log('=== GET EMPLOYEE API CALLED ===');
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('NEXT_PUBLIC_API_URL env:', process.env.NEXT_PUBLIC_API_URL || 'not set');
  
  try {
    const authHeader = request.headers.get('authorization');
    const { id } = await params;
    
    const backendUrl = `${API_BASE_URL}/employees/${id}`;
    console.log('Backend URL:', backendUrl);
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { message: 'Invalid id parameter' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to fetch employee' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get employee API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}


