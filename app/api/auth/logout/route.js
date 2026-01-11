import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function POST(request) {
  console.log('=== LOGOUT API CALLED ===');
  
  try {
    const authHeader = request.headers.get('authorization');
    
    // If no auth header, just return success (client-side logout)
    if (!authHeader) {
      console.log('No authorization header, returning success for client-side logout');
      return NextResponse.json({ message: 'Logout successful' }, { status: 200 });
    }
    
    console.log('Calling backend logout API...');
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      console.log('Backend logout failed:', response.status, data);
      
      // If unauthorized, still return success for client-side logout
      if (response.status === 401 || response.status === 403) {
        console.log('Unauthorized response, but allowing client-side logout');
        return NextResponse.json({ message: 'Logout successful' }, { status: 200 });
      }
      
      return NextResponse.json(
        { message: data.message || data.error || 'Logout failed' },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => ({}));
    console.log('Backend logout successful');
    return NextResponse.json(data || { message: 'Logout successful' }, { status: 200 });
  } catch (error) {
    console.error('Logout API error:', error);
    // Even if API call fails, return success for client-side logout
    return NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );
  }
}




