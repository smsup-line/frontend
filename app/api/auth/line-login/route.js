import { NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';
const DEFAULT_TIMEOUT = 10000;

function extractJwt(data) {
  return data?.token || data?.access_token || data?.jwt || data?.accessToken || null;
}

function asList(value) {
  return Array.isArray(value) ? value : [];
}

function membershipPhone(phone) {
  const p = String(phone || '').trim();
  if (!p || p === '-' || p.startsWith('line:')) return '';
  return p;
}

async function fetchEmployeeMemberships(lineToken, shopId, phone) {
  const params = new URLSearchParams({ line_token: lineToken });
  if (shopId) params.set('shop_id', shopId);
  const knownPhone = membershipPhone(phone);
  if (knownPhone) params.set('phone', knownPhone);
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/employeetokenline?${params.toString()}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } },
    DEFAULT_TIMEOUT
  );
  if (!response.ok) return [];
  const data = await response.json();
  const list = asList(data.employees);
  if (list.length > 0) return list;
  if (data.exists && data.employee) {
    return [{ employee: data.employee, shop: data.shop, branch: data.branch, settings: data.settings }];
  }
  return [];
}

async function fetchCustomerMemberships(lineToken, shopId, phone) {
  const params = new URLSearchParams({ line_token: lineToken });
  if (shopId) params.set('shop_id', shopId);
  const knownPhone = membershipPhone(phone);
  if (knownPhone) params.set('phone', knownPhone);
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/customertokenline?${params.toString()}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } },
    DEFAULT_TIMEOUT
  );
  if (!response.ok) return [];
  const data = await response.json();
  const list = asList(data.customers);
  if (list.length > 0) return list;
  if (data.exists && data.customer) {
    return [{ customer: data.customer, shop: data.shop, branch: data.branch, settings: data.settings }];
  }
  return [];
}

function toOption(membership, userType) {
  const person = membership[userType] || {};
  const shop = membership.shop || {};
  const branch = membership.branch || {};
  return {
    user_type: userType,
    user_id: person.id,
    shop_id: person.shop_id || shop.id || null,
    branch_id: person.branch_id || branch.id || null,
    shop_name: shop.name || 'ร้านค้า',
    branch_name: branch.name || null,
    name: person.name || '',
    otp_verify: person.otp_verify || false,
    phone: person.phone || null,
  };
}

function collectOptions(employees, customers) {
  const options = [
    ...employees.map((item) => toOption(item, 'employee')),
    ...customers.map((item) => toOption(item, 'customer')),
  ].filter((option) => option.user_id && option.shop_id);

  const seen = new Set();
  const unique = [];
  for (const option of options) {
    const key = `${option.user_type}:${option.user_id}:${option.shop_id}:${option.branch_id || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(option);
  }

  unique.sort((a, b) => {
    const shop = String(a.shop_name || '').localeCompare(String(b.shop_name || ''), 'th');
    if (shop !== 0) return shop;
    return String(a.branch_name || '').localeCompare(String(b.branch_name || ''), 'th');
  });
  return unique;
}

async function issueJwt({ line_token, name, avatar_url, shop_id, branch_id, user_type, user_id, phone }) {
  const jwtResponse = await fetchWithTimeout(
    `${API_BASE_URL}/auth/line-login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        line_token,
        name,
        avatar_url,
        shop_id: shop_id || '',
        branch_id: branch_id || null,
        user_type,
        user_id,
        phone: membershipPhone(phone) || undefined,
      }),
    },
    DEFAULT_TIMEOUT
  );
  if (!jwtResponse.ok) return null;
  const jwtData = await jwtResponse.json();
  return extractJwt(jwtData);
}

function loginPayload({ person, shop, branch, userType, jwtToken, extras = {} }) {
  const shopId = person?.shop_id || shop?.id || extras.shop_id || null;
  const branchId = person?.branch_id || branch?.id || extras.branch_id || null;
  return {
    ...person,
    role: userType,
    user_type: userType,
    shop_id: shopId,
    branch_id: branchId,
    shop: shop || null,
    branch: branch || null,
    ...(jwtToken ? { token: jwtToken, access_token: jwtToken } : {}),
    ...extras,
  };
}

async function addRegistrationPoints({ line_token, customerId, jwtToken, shopId }) {
  if (!line_token || !customerId || !jwtToken) return;
  try {
    const params = new URLSearchParams({ line_token });
    if (shopId) params.set('shop_id', shopId);
    const customerTokenResponse = await fetchWithTimeout(
      `${API_BASE_URL}/customertokenline?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`,
        },
      },
      DEFAULT_TIMEOUT
    );
    if (!customerTokenResponse.ok) return;
    const customerTokenData = await customerTokenResponse.json();
    const rate = parseFloat(customerTokenData?.settings?.rate_register_point);
    if (!rate || Number.isNaN(rate) || rate <= 0) return;
    await fetchWithTimeout(
      `${API_BASE_URL}/points`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          customer_id: customerId,
          detail: 'สมัครสมาชิก',
          points: Math.round(rate),
        }),
      },
      DEFAULT_TIMEOUT
    );
  } catch (error) {
    console.error('Failed to add registration points:', error);
  }
}

async function createCustomer({ line_token, name, avatar_url, shop_id, branch_id, phone }) {
  const createResponse = await fetchWithTimeout(
    `${API_BASE_URL}/line-login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        line_token,
        name,
        avatar_url,
        phone: membershipPhone(phone) || undefined,
        shop_id,
        branch_id: branch_id || null,
      }),
    },
    DEFAULT_TIMEOUT
  );
  if (!createResponse.ok) {
    const errData = await createResponse.json().catch(() => ({}));
    return {
      error: true,
      status: createResponse.status,
      message: errData.message || errData.error || 'ไม่สามารถเพิ่มข้อมูลลูกค้าได้',
    };
  }
  const created = await createResponse.json().catch(() => ({}));
  const createdCustomer = created.customer || created.data || created;
  return {
    customer: createdCustomer,
    shop: created.shop || null,
    branch: created.branch || null,
    token: extractJwt(created),
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      line_token,
      name,
      avatar_url,
      shop_id,
      branch_id,
      user_type,
      user_id,
      phone,
      link_employee_id,
    } = body;

    if (!line_token || !name) {
      return NextResponse.json(
        { message: 'Missing required fields: line_token, name' },
        { status: 400 }
      );
    }

    const shopId = shop_id || '';
    const branchId = branch_id || null;

    // Staff: link LINE via same shop LIFF (per-shop user id) then sign in as employee.
    if (link_employee_id) {
      const linkResponse = await fetchWithTimeout(
        `${API_BASE_URL}/employees/${encodeURIComponent(link_employee_id)}/line-login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            line_token,
            name,
            avatar_url,
          }),
        },
        DEFAULT_TIMEOUT
      );
      const linked = await linkResponse.json().catch(() => ({}));
      if (!linkResponse.ok) {
        return NextResponse.json(
          { message: linked.message || linked.error || 'เชื่อมต่อ LINE พนักงานไม่สำเร็จ' },
          { status: linkResponse.status }
        );
      }
      const empShopId = linked.shop_id || shopId;
      const empBranchId = linked.branch_id || branchId;
      const jwtToken = await issueJwt({
        line_token,
        name: linked.name || name,
        avatar_url: linked.avatar_url || avatar_url,
        shop_id: empShopId,
        branch_id: empBranchId,
        user_type: 'employee',
        user_id: linked.id || link_employee_id,
        phone: linked.phone || phone,
      });
      if (!jwtToken) {
        return NextResponse.json({ message: 'ไม่สามารถออก token เข้าสู่ระบบได้' }, { status: 500 });
      }
      return NextResponse.json(
        loginPayload({
          person: { ...linked, line_token },
          shop: empShopId ? { id: empShopId } : null,
          branch: empBranchId ? { id: empBranchId } : null,
          userType: 'employee',
          jwtToken,
          extras: { shop_id: empShopId, branch_id: empBranchId },
        }),
        { status: 200 }
      );
    }

    // Always load every shop/branch this LINE account belongs to.
    // Filtering by shop_id here would hide other memberships and skip the picker.
    const [employees, customers] = await Promise.all([
      fetchEmployeeMemberships(line_token, shopId, phone),
      fetchCustomerMemberships(line_token, shopId, phone),
    ]);

    const finishMembership = async (membership, userType) => {
      const person = membership[userType];
      const jwtToken = await issueJwt({
        line_token,
        name: name || person?.name,
        avatar_url: avatar_url || person?.avatar_url,
        shop_id: person?.shop_id || membership.shop?.id || shopId,
        branch_id: person?.branch_id || membership.branch?.id || branchId,
        user_type: userType,
        user_id: person?.id,
        phone,
      });
      return NextResponse.json(
        loginPayload({
          person: { ...person, name: name || person?.name, avatar_url: avatar_url || person?.avatar_url, line_token },
          shop: membership.shop,
          branch: membership.branch,
          userType,
          jwtToken,
        }),
        { status: 200 }
      );
    };

    const selectionResponse = (list) =>
      NextResponse.json(
        {
          requires_selection: true,
          options: list,
          line_token,
          name,
          avatar_url,
        },
        { status: 200 }
      );

    const findMembership = (list, key, id) =>
      list.find((item) => String(item[key]?.id || '') === String(id || ''));

    // User tapped a shop/branch on the picker
    if (user_id && user_type) {
      const list = user_type === 'employee' ? employees : customers;
      const selected = findMembership(list, user_type, user_id);
      if (!selected) {
        return NextResponse.json(
          { message: 'ไม่พบข้อมูลร้านที่เลือก', error_code: 'NOT_REGISTERED' },
          { status: 404 }
        );
      }
      return finishMembership(selected, user_type);
    }

    let options = collectOptions(employees, customers);
    const alreadyMemberOfShop = Boolean(
      shopId && options.some((option) => String(option.shop_id) === String(shopId))
    );

    // QR of a shop this LINE account has not joined yet → register, then pick if they now have several shops
    if (shopId && !alreadyMemberOfShop) {
      const created = await createCustomer({
        line_token,
        name,
        avatar_url,
        shop_id: shopId,
        branch_id: branchId,
        phone,
      });
      if (created.error) {
        return NextResponse.json(
          { message: created.message, error_code: 'CREATE_CUSTOMER_FAILED' },
          { status: created.status }
        );
      }

      const refreshedCustomers = await fetchCustomerMemberships(line_token, '', phone);
      const refreshedEmployees = employees;
      options = collectOptions(refreshedEmployees, refreshedCustomers);

      if (options.length > 1) {
        return selectionResponse(options);
      }

      const finalShopId = created.customer?.shop_id || created.shop?.id || shopId;
      const finalBranchId = created.customer?.branch_id || created.branch?.id || branchId;
      const jwtToken =
        created.token ||
        (await issueJwt({
          line_token,
          name: created.customer?.name || name,
          avatar_url: created.customer?.avatar_url || avatar_url,
          shop_id: finalShopId,
          branch_id: finalBranchId,
          user_type: 'customer',
          user_id: created.customer?.id,
          phone,
        }));

      await addRegistrationPoints({
        line_token,
        customerId: created.customer?.id,
        jwtToken,
        shopId: finalShopId,
      });

      return NextResponse.json(
        loginPayload({
          person: {
            ...created.customer,
            name: created.customer?.name || name,
            avatar_url: created.customer?.avatar_url || avatar_url,
            phone: created.customer?.phone || '-',
            line_token,
          },
          shop: created.shop,
          branch: created.branch,
          userType: 'customer',
          jwtToken,
          extras: { created_via: 'qr', shop_id: finalShopId, branch_id: finalBranchId },
        }),
        { status: 201 }
      );
    }

    if (options.length > 1) {
      return selectionResponse(options);
    }

    if (options.length === 1) {
      const only = options[0];
      const list = only.user_type === 'employee' ? employees : customers;
      const selected = findMembership(list, only.user_type, only.user_id) || list[0];
      return finishMembership(selected, only.user_type);
    }

    return NextResponse.json(
      {
        message: 'ยังไม่ลงทะเบียน กรุณาลงทะเบียนที่หน้าร้าน',
        error_code: 'NOT_REGISTERED',
        line_token,
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('LINE login API error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้', error: error.message },
      { status: 500 }
    );
  }
}
