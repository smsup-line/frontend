import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    const response = await fetch(`${API_BASE_URL}/setting-center`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    // ถ้าเป็น 400 หรือ 404 (ยังไม่มี record ในฐานข้อมูล) ให้ return default value แทน error
    if (!response.ok) {
      const status = response.status;
      const data = await response.json().catch(() => ({}));
      
      // ตรวจสอบว่าเป็น error 400 หรือ 404 (ไม่เจอข้อมูล)
      if (status === 400 || status === 404) {
        console.log('Settings center not found, returning default value');
        // Return default value
        return NextResponse.json({
          id: null,
          rate_commission_point: '',
          rate_commission_cash: '',
          created_at: null,
          updated_at: null,
        }, { status: 200 }); // Return 200 OK แทน 400/404
      }
      
      // Error อื่นๆ ให้ return error ตามปกติ
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to fetch settings center' },
        { status: status }
      );
    }

    // ถ้า response OK ให้ return ข้อมูลตามปกติ
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Settings center API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    // Parse JSON body with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { message: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Prepare body - keep values as strings (backend expects string format)
    // Convert undefined/null to empty string for consistency
    const cleanedBody = {
      rate_commission_point: body.rate_commission_point || '',
      rate_commission_cash: body.rate_commission_cash || '',
    };
    
    const requestBody = JSON.stringify(cleanedBody);
    
    console.log('Settings center PUT request:', {
      originalBody: body,
      cleanedBody,
      requestBodyString: requestBody,
      apiUrl: `${API_BASE_URL}/setting-center`,
    });
    
    const response = await fetch(`${API_BASE_URL}/setting-center`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: requestBody,
    });

    if (!response.ok) {
      const responseText = await response.text();
      let data = {};
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse error response:', responseText);
        data = { message: responseText || 'Failed to update settings center' };
      }
      
      console.error('Backend API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: data,
        originalBody: cleanedBody,
      });
      
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to update settings center' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Update settings center API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

