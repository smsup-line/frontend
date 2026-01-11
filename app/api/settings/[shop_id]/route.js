import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(request, { params }) {
  try {
    const { shop_id } = await params;
    
    console.log('=== GET /api/settings/[shop_id] ===');
    console.log('shop_id:', shop_id);
    
    // Validate shop_id
    if (!shop_id || shop_id === 'undefined' || shop_id.trim() === '') {
      return NextResponse.json(
        { message: 'invalid shop_id' },
        { status: 400 }
      );
    }
    
    const authHeader = request.headers.get('authorization');
    console.log('Authorization header:', authHeader ? 'present' : 'missing');
    if (authHeader) {
      console.log('Authorization header value:', authHeader.substring(0, 20) + '...');
    }
    
    if (!authHeader) {
      console.error('Authorization header is missing');
      return NextResponse.json(
        { message: 'Authorization header is required' },
        { status: 401 }
      );
    }
    
    console.log('Fetching settings from backend:', `${API_BASE_URL}/settings/${shop_id}`);
    const response = await fetch(`${API_BASE_URL}/settings/${shop_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });
    
    console.log('Backend response status:', response.status);

    // ถ้าเป็น 400 หรือ 404 (ยังไม่มี record ในฐานข้อมูล) ให้ return default value แทน error
    if (!response.ok) {
      const status = response.status;
      const data = await response.json().catch(() => ({}));
      
      // ตรวจสอบว่าเป็น error 400 หรือ 404 (ไม่เจอข้อมูล)
      if (status === 400 || status === 404) {
        console.log('Settings not found for shop_id:', shop_id, 'returning default value');
        // Return default value ตาม spec: ถ้ายังไม่มี record จะ return default values
        return NextResponse.json({
          id: null,
          shop_id: shop_id,
          total_check_tax: '',
          rate_register_point: '',
          rate_total_point: '',
          created_at: null,
          updated_at: null,
        }, { status: 200 }); // Return 200 OK แทน 400/404
      }
      
      // Error อื่นๆ ให้ return error ตามปกติ
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to fetch settings' },
        { status: status }
      );
    }

    // ถ้า response OK ให้ return ข้อมูลตามปกติ
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { shop_id } = await params;
    
    // Validate shop_id
    if (!shop_id || shop_id === 'undefined' || shop_id.trim() === '') {
      return NextResponse.json(
        { message: 'invalid shop_id' },
        { status: 400 }
      );
    }
    
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
      total_check_tax: body.total_check_tax || '',
      rate_register_point: body.rate_register_point || '',
      rate_total_point: body.rate_total_point || '',
    };
    
    // Validate and stringify JSON
    let requestBodyString;
    try {
      requestBodyString = JSON.stringify(cleanedBody);
      // Validate that JSON is valid
      JSON.parse(requestBodyString);
    } catch (jsonError) {
      console.error('Failed to stringify JSON:', jsonError, { cleanedBody });
      return NextResponse.json(
        { message: 'Invalid JSON data' },
        { status: 400 }
      );
    }
    
    console.log('Settings PUT request:', {
      shop_id,
      originalBody: body,
      cleanedBody,
      requestBodyString,
      apiUrl: `${API_BASE_URL}/settings/${shop_id}`,
    });
    
    const response = await fetch(`${API_BASE_URL}/settings/${shop_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: requestBodyString,
    });

    if (!response.ok) {
      const responseText = await response.text();
      let data = {};
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse error response:', responseText);
        data = { message: responseText || 'Failed to update settings' };
      }
      
      console.error('Backend API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: data,
        originalBody: cleanedBody,
      });
      
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to update settings' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Update settings API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}


      return NextResponse.json(
        { message: data.message || data.error || 'Failed to update settings' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Update settings API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}


      return NextResponse.json(
        { message: data.message || data.error || 'Failed to update settings' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Update settings API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

