import { NextResponse } from 'next/server';

// Get API base URL from environment variable
// Use NEXT_PUBLIC_API_URL as primary source
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    console.log('=== GET /api/receipts ===');
    console.log('Authorization header:', authHeader ? 'present' : 'missing');
    console.log('Authorization header value:', authHeader ? authHeader.substring(0, 20) + '...' : 'none');
    
    if (!authHeader) {
      console.error('Authorization header is missing');
      return NextResponse.json(
        { message: 'Authorization header is required' },
        { status: 401 }
      );
    }
    
    console.log('Fetching receipts from backend:', `${API_BASE_URL}/receipts`);
    console.log('Request headers:', {
      'Content-Type': 'application/json',
      'Authorization': authHeader ? authHeader.substring(0, 30) + '...' : 'missing',
    });
    
    const response = await fetch(`${API_BASE_URL}/receipts`, {
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
        data = { message: responseText || 'Failed to fetch receipts' };
      }
      
      console.error('Backend error data:', data);
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to fetch receipts' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get receipts API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Authorization header is required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    console.log('Receipt API request body:', JSON.stringify(body, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/receipts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to create receipt' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Create receipt API error:', error);
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
    
    console.log('=== GET /api/receipts ===');
    console.log('Authorization header:', authHeader ? 'present' : 'missing');
    console.log('Authorization header value:', authHeader ? authHeader.substring(0, 20) + '...' : 'none');
    
    if (!authHeader) {
      console.error('Authorization header is missing');
      return NextResponse.json(
        { message: 'Authorization header is required' },
        { status: 401 }
      );
    }
    
    console.log('Fetching receipts from backend:', `${API_BASE_URL}/receipts`);
    console.log('Request headers:', {
      'Content-Type': 'application/json',
      'Authorization': authHeader ? authHeader.substring(0, 30) + '...' : 'missing',
    });
    
    const response = await fetch(`${API_BASE_URL}/receipts`, {
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
        data = { message: responseText || 'Failed to fetch receipts' };
      }
      
      console.error('Backend error data:', data);
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to fetch receipts' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get receipts API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Authorization header is required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    console.log('Receipt API request body:', JSON.stringify(body, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/receipts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to create receipt' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Create receipt API error:', error);
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
    
    console.log('=== GET /api/receipts ===');
    console.log('Authorization header:', authHeader ? 'present' : 'missing');
    console.log('Authorization header value:', authHeader ? authHeader.substring(0, 20) + '...' : 'none');
    
    if (!authHeader) {
      console.error('Authorization header is missing');
      return NextResponse.json(
        { message: 'Authorization header is required' },
        { status: 401 }
      );
    }
    
    console.log('Fetching receipts from backend:', `${API_BASE_URL}/receipts`);
    console.log('Request headers:', {
      'Content-Type': 'application/json',
      'Authorization': authHeader ? authHeader.substring(0, 30) + '...' : 'missing',
    });
    
    const response = await fetch(`${API_BASE_URL}/receipts`, {
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
        data = { message: responseText || 'Failed to fetch receipts' };
      }
      
      console.error('Backend error data:', data);
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to fetch receipts' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get receipts API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Authorization header is required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    console.log('Receipt API request body:', JSON.stringify(body, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/receipts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to create receipt' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Create receipt API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

