import { NextResponse } from 'next/server';

// Get API base URL from environment variable
// Use NEXT_PUBLIC_API_URL as primary source
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    console.log('=== GET /api/employee-receipts ===');
    console.log('Authorization header:', authHeader ? 'present' : 'missing');
    console.log('Authorization header value:', authHeader ? authHeader.substring(0, 20) + '...' : 'none');
    
    if (!authHeader) {
      console.error('Authorization header is missing');
      return NextResponse.json(
        { message: 'Authorization header is required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const shop_id = searchParams.get('shop_id');
    const branch_id = searchParams.get('branch_id');
    
    console.log('Query parameters:', { shop_id, branch_id });
    
    if (!shop_id) {
      return NextResponse.json(
        { message: 'shop_id query parameter is required' },
        { status: 400 }
      );
    }

    // Build URL with query parameters
    let backendUrl = `${API_BASE_URL}/employee-receipts?shop_id=${encodeURIComponent(shop_id)}`;
    if (branch_id) {
      backendUrl += `&branch_id=${encodeURIComponent(branch_id)}`;
    }
    
    console.log('Fetching employee receipts from backend:', backendUrl);
    console.log('Request headers:', {
      'Content-Type': 'application/json',
      'Authorization': authHeader ? authHeader.substring(0, 30) + '...' : 'missing',
    });
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
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
        data = { message: responseText || 'Failed to fetch employee receipts' };
      }
      
      console.error('Backend error data:', data);
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to fetch employee receipts' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Employee receipts fetched successfully, count:', Array.isArray(data) ? data.length : 'N/A');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get employee receipts API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}


