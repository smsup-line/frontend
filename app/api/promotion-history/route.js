import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// GET /api/promotion-history - ดึงประวัติการใช้โปรโมชั่น
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = queryString 
      ? `${API_BASE_URL}/promotion-history?${queryString}`
      : `${API_BASE_URL}/promotion-history`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to fetch promotion history' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Promotion history API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

// POST /api/promotion-history - สร้างประวัติการใช้โปรโมชั่น
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    
    console.log('=== CREATE PROMOTION HISTORY ===');
    console.log('Request body:', JSON.stringify(body, null, 2));
    console.log('Authorization header:', authHeader ? 'present' : 'missing');
    
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Authorization header is required' },
        { status: 401 }
      );
    }
    
    const response = await fetch(`${API_BASE_URL}/promotion-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const responseText = await response.text();
      let errorData = {};
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { message: responseText || 'Failed to create promotion history' };
      }
      
      console.error('Backend error:', errorData);
      return NextResponse.json(
        { message: errorData.message || errorData.error || 'Failed to create promotion history' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Promotion history created successfully:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Create promotion history API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

        errorData = { message: responseText || 'Failed to create promotion history' };
      }
      
      console.error('Backend error:', errorData);
      return NextResponse.json(
        { message: errorData.message || errorData.error || 'Failed to create promotion history' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Promotion history created successfully:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Create promotion history API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

        errorData = { message: responseText || 'Failed to create promotion history' };
      }
      
      console.error('Backend error:', errorData);
      return NextResponse.json(
        { message: errorData.message || errorData.error || 'Failed to create promotion history' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Promotion history created successfully:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Create promotion history API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}
