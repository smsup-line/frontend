import { NextResponse } from 'next/server';

// Get API base URL from environment variable
// Use NEXT_PUBLIC_API_URL as primary source
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

export async function GET(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { message: 'Missing receipt id' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${API_BASE_URL}/receipts/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to fetch receipt' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get receipt API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    
    console.log('=== PUT /api/receipts/[id] ===');
    console.log('Receipt ID:', id);
    
    if (!id) {
      return NextResponse.json(
        { message: 'Missing receipt id' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    console.log('Update receipt request body:', JSON.stringify(body, null, 2));
    console.log('Backend URL:', `${API_BASE_URL}/receipts/${id}`);
    console.log('No authorization header required for this endpoint');
    
    const response = await fetch(`${API_BASE_URL}/receipts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    console.log('Backend response status:', response.status);
    console.log('Backend response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const responseText = await response.text();
      console.error('Backend error response text:', responseText);
      
      let data = {};
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse error response as JSON:', e);
        data = { message: responseText || 'Failed to update receipt' };
      }
      
      console.error('Backend error data:', data);
      console.error('Backend response status:', response.status);
      
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to update receipt' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Update receipt API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

