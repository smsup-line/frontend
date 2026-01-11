import { NextResponse } from 'next/server';

// Get API base URL from environment variable
// Use NEXT_PUBLIC_API_URL as primary source
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Authorization header is required' },
        { status: 401 }
      );
    }
    
    // Get customer_id from query parameter
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    
    // Build URL with customer_id if provided
    let apiUrl = `${API_BASE_URL}/customerpoint`;
    if (customerId) {
      apiUrl += `?customer_id=${encodeURIComponent(customerId)}`;
    }
    
    console.log('Fetching customer points from:', apiUrl);
    console.log('Customer ID:', customerId || 'not provided');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to fetch customer points' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get customer points API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}


// Get API base URL from environment variable
// Use NEXT_PUBLIC_API_URL as primary source
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Authorization header is required' },
        { status: 401 }
      );
    }
    
    // Get customer_id from query parameter
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    
    // Build URL with customer_id if provided
    let apiUrl = `${API_BASE_URL}/customerpoint`;
    if (customerId) {
      apiUrl += `?customer_id=${encodeURIComponent(customerId)}`;
    }
    
    console.log('Fetching customer points from:', apiUrl);
    console.log('Customer ID:', customerId || 'not provided');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to fetch customer points' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get customer points API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}


// Get API base URL from environment variable
// Use NEXT_PUBLIC_API_URL as primary source
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Authorization header is required' },
        { status: 401 }
      );
    }
    
    // Get customer_id from query parameter
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    
    // Build URL with customer_id if provided
    let apiUrl = `${API_BASE_URL}/customerpoint`;
    if (customerId) {
      apiUrl += `?customer_id=${encodeURIComponent(customerId)}`;
    }
    
    console.log('Fetching customer points from:', apiUrl);
    console.log('Customer ID:', customerId || 'not provided');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to fetch customer points' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get customer points API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

