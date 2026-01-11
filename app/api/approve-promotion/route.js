import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// PUT /api/approve-promotion - อนุมัติโปรโมชั่น
export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    
    const { shop_id, branch_id, promotion_history_id } = body;
    
    if (!shop_id) {
      return NextResponse.json(
        { message: 'Missing shop_id' },
        { status: 400 }
      );
    }
    
    if (!branch_id) {
      return NextResponse.json(
        { message: 'Missing branch_id' },
        { status: 400 }
      );
    }
    
    if (!promotion_history_id) {
      return NextResponse.json(
        { message: 'Missing promotion_history_id' },
        { status: 400 }
      );
    }
    
    console.log('PUT /api/approve-promotion');
    console.log('Shop ID:', shop_id);
    console.log('Branch ID:', branch_id);
    console.log('Promotion History ID:', promotion_history_id);
    
    const response = await fetch(`${API_BASE_URL}/approve-promotion`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify({
        shop_id,
        branch_id,
        promotion_history_id,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to approve promotion' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Approve promotion API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// PUT /api/approve-promotion - อนุมัติโปรโมชั่น
export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    
    const { shop_id, branch_id, promotion_history_id } = body;
    
    if (!shop_id) {
      return NextResponse.json(
        { message: 'Missing shop_id' },
        { status: 400 }
      );
    }
    
    if (!branch_id) {
      return NextResponse.json(
        { message: 'Missing branch_id' },
        { status: 400 }
      );
    }
    
    if (!promotion_history_id) {
      return NextResponse.json(
        { message: 'Missing promotion_history_id' },
        { status: 400 }
      );
    }
    
    console.log('PUT /api/approve-promotion');
    console.log('Shop ID:', shop_id);
    console.log('Branch ID:', branch_id);
    console.log('Promotion History ID:', promotion_history_id);
    
    const response = await fetch(`${API_BASE_URL}/approve-promotion`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify({
        shop_id,
        branch_id,
        promotion_history_id,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to approve promotion' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Approve promotion API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// PUT /api/approve-promotion - อนุมัติโปรโมชั่น
export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    
    const { shop_id, branch_id, promotion_history_id } = body;
    
    if (!shop_id) {
      return NextResponse.json(
        { message: 'Missing shop_id' },
        { status: 400 }
      );
    }
    
    if (!branch_id) {
      return NextResponse.json(
        { message: 'Missing branch_id' },
        { status: 400 }
      );
    }
    
    if (!promotion_history_id) {
      return NextResponse.json(
        { message: 'Missing promotion_history_id' },
        { status: 400 }
      );
    }
    
    console.log('PUT /api/approve-promotion');
    console.log('Shop ID:', shop_id);
    console.log('Branch ID:', branch_id);
    console.log('Promotion History ID:', promotion_history_id);
    
    const response = await fetch(`${API_BASE_URL}/approve-promotion`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify({
        shop_id,
        branch_id,
        promotion_history_id,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to approve promotion' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Approve promotion API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้' },
      { status: 500 }
    );
  }
}

