import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(request) {
  console.log('=== GET EMPLOYEE TOKEN LINE API CALLED ===');
  console.log('API_BASE_URL:', API_BASE_URL);
  
  try {
    const { searchParams } = new URL(request.url);
    const lineToken = searchParams.get('line_token');
    
    if (!lineToken) {
      return NextResponse.json(
        { message: 'line_token parameter is required' },
        { status: 400 }
      );
    }
    
    console.log('Fetching employee with line_token:', lineToken);
    
    const response = await fetch(`${API_BASE_URL}/employeetokenline?line_token=${encodeURIComponent(lineToken)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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
    console.error('Get employee token line API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}


