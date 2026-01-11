import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// GET /api/my-promotions - ดึงโปรโมชั่นที่ลูกค้ารับสิทธิ์
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const shopId = searchParams.get('shop_id');
    const branchId = searchParams.get('branch_id');
    
    // Build query string
    const queryParams = new URLSearchParams();
    if (customerId) queryParams.append('customer_id', customerId);
    if (shopId) queryParams.append('shop_id', shopId);
    if (branchId) queryParams.append('branch_id', branchId);
    
    const queryString = queryParams.toString();
    const apiUrl = queryString 
      ? `${API_BASE_URL}/my-promotions?${queryString}`
      : `${API_BASE_URL}/my-promotions`;
    
    console.log('=== MY PROMOTIONS API REQUEST ===');
    console.log('Backend URL:', apiUrl);
    console.log('Query params:', { customer_id: customerId, shop_id: shopId, branch_id: branchId });
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('My promotions response status:', response.status);

    if (!response.ok) {
      let errorData = {};
      let errorMessage = `Failed to fetch my promotions (${response.status})`;
      
      try {
        const responseText = await response.text();
        console.log('Error response body:', responseText);
        
        if (responseText) {
          try {
            errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            errorMessage = responseText || errorMessage;
          }
        }
      } catch (e) {
        console.error('Failed to read error response:', e);
      }
      
      console.error('=== MY PROMOTIONS API ERROR ===');
      console.error('Status:', response.status);
      console.error('Error message:', errorMessage);
      console.error('Error data:', errorData);
      
      return NextResponse.json(
        { message: errorMessage, ...errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('My promotions loaded successfully, count:', Array.isArray(data) ? data.length : 'not an array');
    return NextResponse.json(data);
  } catch (error) {
    console.error('=== MY PROMOTIONS API EXCEPTION ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { message: error.message || 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

