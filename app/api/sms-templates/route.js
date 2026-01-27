import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = queryString 
      ? `${API_BASE_URL}/sms-templates?${queryString}`
      : `${API_BASE_URL}/sms-templates`;
    
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
        { message: data.message || data.error || 'Failed to fetch SMS templates' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('SMS templates API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    
    // ดึง sms_sendername จาก settings ถ้ามี shop_id ใน body
    let smsSenderName = '';
    if (body.shop_id && authHeader) {
      try {
        const settingsResponse = await fetch(`${API_BASE_URL}/settings/${body.shop_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
        });
        
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          smsSenderName = settingsData.sms_sendername || '';
        }
      } catch (settingsError) {
        console.warn('Failed to fetch SMS sender name from settings:', settingsError);
        // Continue without sms_sendername if settings fetch fails
      }
    }
    
    // เพิ่ม sms_sendername ใน body ถ้ามี
    const requestBody = {
      ...body,
      ...(smsSenderName && { sms_sendername: smsSenderName }),
    };
    
    const response = await fetch(`${API_BASE_URL}/sms-templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to create SMS template' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Create SMS template API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}




