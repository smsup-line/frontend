import { NextResponse } from 'next/server';

// Get API base URL from environment variable
// Use NEXT_PUBLIC_API_URL as primary source
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

export async function POST(request) {
  console.log('=== LINE LOGIN API CALLED ===');
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('API_URL env:', process.env.API_URL || 'not set');
  console.log('NEXT_PUBLIC_API_URL env:', process.env.NEXT_PUBLIC_API_URL || 'not set');
  
  try {
    const body = await request.json();
    const { line_token, name, avatar_url, shop_id, branch_id } = body;

    console.log('Request body:', {
      line_token,
      name,
      avatar_url: avatar_url ? 'provided' : 'missing',
      shop_id,
      branch_id,
    });

    // Validate required fields
    if (!line_token || !name || !avatar_url) {
      console.log('Missing required fields');
      return NextResponse.json(
        { message: 'Missing required fields: line_token, name, avatar_url' },
        { status: 400 }
      );
    }

    console.log('Step 1: Checking employee with line_token:', line_token);

    // Step 1: Check if employee exists by line_token
    let employeeData = null;
    let shopData = null;
    let branchData = null;
    
    try {
      const employeeUrl = `${API_BASE_URL}/employeetokenline?line_token=${encodeURIComponent(line_token)}`;
      console.log('Employee check URL:', employeeUrl);
      
      const employeeResponse = await fetch(employeeUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Employee response status:', employeeResponse.status);

      if (employeeResponse.ok) {
        const responseData = await employeeResponse.json();
        console.log('Employee token check response:', JSON.stringify(responseData, null, 2));
        
        // Check response format according to API specification
        if (responseData.exists === true && responseData.employee) {
          // Format: { exists: true, employee: {...}, shop: {...}, branch: {...} }
          employeeData = responseData.employee;
          shopData = responseData.shop || null;
          branchData = responseData.branch || null;
          console.log('Employee found:', employeeData.id, employeeData.name, employeeData.line_token);
        } else if (responseData.exists === false) {
          // Format: { exists: false }
          console.log('Employee not found - exists: false');
        } else {
          // Handle other response formats for backward compatibility
          if (responseData.employee && responseData.employee.id) {
            employeeData = responseData.employee;
            shopData = responseData.shop || null;
            branchData = responseData.branch || null;
            console.log('Employee found (alternative format):', employeeData.id, employeeData.name);
          } else {
            console.log('Employee data structure not recognized:', Object.keys(responseData));
          }
        }
      } else {
        const errorData = await employeeResponse.json().catch(() => ({}));
        console.log('Employee token check failed:', employeeResponse.status, errorData);
      }
    } catch (error) {
      console.error('Employee token check endpoint error:', error);
      // Continue to check customers if employees endpoint fails
    }

    // If employee found, allow employee to login and generate JWT
    if (employeeData && employeeData.id) {
      console.log('=== EMPLOYEE FOUND ===');
      console.log('Employee ID:', employeeData.id);
      console.log('Employee Name:', employeeData.name);
      console.log('Employee Line Token:', employeeData.line_token);
      
      // Extract shop_id and branch_id from employee data or shop/branch objects
      const finalShopId = employeeData.shop_id || shopData?.id || shop_id || null;
      const finalBranchId = employeeData.branch_id || branchData?.id || branch_id || null;
      
      console.log('Shop ID:', finalShopId);
      console.log('Branch ID:', finalBranchId);
      
      // Call backend to generate JWT token for employee using NEXT_PUBLIC_API_URL
      let jwtToken = null;
      try {
        console.log('=== CALLING BACKEND /auth/line-login TO GET JWT TOKEN (EMPLOYEE) ===');
        console.log('Backend URL:', `${API_BASE_URL}/auth/line-login`);
        console.log('Using NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'not set');
        
        const jwtRequestBody = {
          line_token,
          name: name || employeeData.name,
          avatar_url: avatar_url || employeeData.avatar_url,
          shop_id: finalShopId,
          branch_id: finalBranchId,
          user_type: 'employee',
          user_id: employeeData.id,
        };
        console.log('JWT request body (employee):', JSON.stringify(jwtRequestBody, null, 2));
        
        const jwtResponse = await fetch(`${API_BASE_URL}/auth/line-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(jwtRequestBody),
        });

        console.log('JWT response status (employee):', jwtResponse.status);
        console.log('JWT response headers (employee):', Object.fromEntries(jwtResponse.headers.entries()));

        if (jwtResponse.ok) {
          const jwtData = await jwtResponse.json();
          console.log('JWT response data (employee):', JSON.stringify(jwtData, null, 2));
          
          // Try multiple possible field names for JWT token
          jwtToken = jwtData.token || jwtData.access_token || jwtData.jwt || jwtData.accessToken || null;
          
          if (jwtToken) {
            console.log('=== JWT TOKEN GENERATED SUCCESSFULLY (EMPLOYEE) ===');
            console.log('JWT token (first 20 chars):', jwtToken.substring(0, 20) + '...');
          } else {
            console.log('JWT token not found in response. Available keys:', Object.keys(jwtData));
            console.log('Full response:', jwtData);
          }
        } else {
          const jwtErrorData = await jwtResponse.json().catch(() => ({}));
          console.error('JWT generation failed for employee');
          console.error('Status:', jwtResponse.status);
          console.error('Error data:', jwtErrorData);
        }
      } catch (jwtError) {
        console.error('=== JWT GENERATION ERROR (EMPLOYEE) ===');
        console.error('Error:', jwtError);
        console.error('Error message:', jwtError.message);
        console.error('Error stack:', jwtError.stack);
        console.log('Continuing without JWT token');
      }
      
      // Return employee data with JWT token if available
      console.log('Returning employee login response...');
      return NextResponse.json({
        ...employeeData,
        name: name || employeeData.name,
        avatar_url: avatar_url || employeeData.avatar_url,
        line_token: line_token || employeeData.line_token,
        role: 'employee',
        user_type: 'employee',
        shop_id: finalShopId,
        branch_id: finalBranchId,
        shop: shopData,
        branch: branchData,
        token: jwtToken, // Include JWT token in the response
      }, { status: 200 });
      
      // Fallback: Return data without JWT if backend JWT generation fails
      console.log('Returning employee login response without JWT...');
      return NextResponse.json({
        ...employeeData,
        name: name || employeeData.name,
        avatar_url: avatar_url || employeeData.avatar_url,
        line_token: line_token || employeeData.line_token,
        role: 'employee',
        user_type: 'employee',
        shop_id: finalShopId,
        branch_id: finalBranchId,
        shop: shopData,
        branch: branchData,
      }, { status: 200 });
    }

    console.log('=== EMPLOYEE NOT FOUND ===');
    console.log('Step 2: Checking customer with line_token:', line_token);
    console.log('(Employee check completed - no employee found, proceeding to customer check)');

    // Step 2: Check if customer exists by line_token (ONLY IF EMPLOYEE NOT FOUND)
    let customerData = null;
    let customerShopData = null;
    let customerBranchData = null;
    
    try {
      const customerResponse = await fetch(`${API_BASE_URL}/customertokenline?line_token=${encodeURIComponent(line_token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (customerResponse.ok) {
        const responseData = await customerResponse.json();
        console.log('Customer token check response:', JSON.stringify(responseData, null, 2));
        
        // Check response format according to API specification
        if (responseData.exists === true && responseData.customer) {
          // Format: { exists: true, customer: {...}, shop: {...}, branch: {...} }
          customerData = responseData.customer;
          customerShopData = responseData.shop || null;
          customerBranchData = responseData.branch || null;
          console.log('Customer found:', customerData.id, customerData.name, customerData.line_token);
        } else if (responseData.exists === false) {
          // Format: { exists: false }
          console.log('Customer not found - exists: false');
        } else {
          // Handle other response formats for backward compatibility
          if (responseData.customer && responseData.customer.id) {
            customerData = responseData.customer;
            customerShopData = responseData.shop || null;
            customerBranchData = responseData.branch || null;
            console.log('Customer found (alternative format):', customerData.id, customerData.name);
          } else {
            console.log('Customer data structure not recognized:', Object.keys(responseData));
          }
        }
      } else {
        const errorData = await customerResponse.json().catch(() => ({}));
        console.log('Customer token check failed:', customerResponse.status, errorData);
      }
    } catch (error) {
      console.error('Customer token check endpoint error:', error);
    }

    // Step 3: If no customer found:
    // - If shop_id is provided (e.g. user came from employee QR with shop/branch),
    //   auto-create customer via backend POST /line-login
    // - Otherwise, return NOT_REGISTERED
    if (!customerData || !customerData.id) {
      console.log('=== CUSTOMER NOT FOUND ===');

      // If user came with shop_id (QR registration), create customer immediately
      if (shop_id) {
        console.log('shop_id provided, attempting auto-create customer via /line-login...');
        try {
          const createUrl = `${API_BASE_URL}/line-login`;
          console.log('Create customer URL:', createUrl);
          
          const createRequestBody = {
            line_token,
            name,
            avatar_url,
            phone: '-', // Default phone number for auto-registered customers
            shop_id,
            branch_id: branch_id || null,
          };
          
          console.log('Create customer request body:', JSON.stringify(createRequestBody, null, 2));

          const createResponse = await fetch(createUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createRequestBody),
          });

          console.log('Create customer response status:', createResponse.status);

          if (!createResponse.ok) {
            const errData = await createResponse.json().catch(() => ({}));
            console.error('Create customer failed:', createResponse.status, errData);
            return NextResponse.json(
              {
                message: errData.message || errData.error || 'ไม่สามารถเพิ่มข้อมูลลูกค้าได้',
                error_code: 'CREATE_CUSTOMER_FAILED',
              },
              { status: createResponse.status }
            );
          }

          const created = await createResponse.json().catch(() => ({}));
          console.log('=== CREATE CUSTOMER RESPONSE ===');
          console.log('Full response:', JSON.stringify(created, null, 2));
          console.log('Created customer phone field:', created?.phone || created?.customer?.phone || created?.data?.phone || 'not found');

          // Support both {customer, shop, branch} and direct customer object
          const createdCustomer = created.customer || created.data || created;
          
          // Check if JWT token is already in the response from /line-login endpoint
          // Backend might return JWT token directly in the response
          let jwtToken = created.token || created.access_token || created.jwt || created.accessToken || created.accessToken || null;
          if (jwtToken) {
            console.log('=== JWT TOKEN FOUND IN CREATE CUSTOMER RESPONSE ===');
            console.log('JWT token (first 20 chars):', jwtToken.substring(0, 20) + '...');
          } else {
            console.log('JWT token not found in create customer response');
            console.log('Available keys in response:', Object.keys(created));
          }
          
          // Ensure phone is set to '-' if not provided by backend
          if (!createdCustomer?.phone) {
            console.log('Phone not found in response, setting to "-"');
            createdCustomer.phone = '-';
          }
          const createdShop = created.shop || null;
          const createdBranch = created.branch || null;

          const finalShopId =
            createdCustomer?.shop_id || createdShop?.id || shop_id || null;
          const finalBranchId =
            createdCustomer?.branch_id || createdBranch?.id || branch_id || null;

          // If JWT token is not in the response, call backend /auth/line-login to get JWT token
          if (!jwtToken) {
            console.log('=== CALLING BACKEND /auth/line-login TO GET JWT TOKEN ===');
            console.log('Backend URL:', `${API_BASE_URL}/auth/line-login`);
            
            try {
              const jwtRequestBody = {
                line_token,
                name: createdCustomer?.name || name,
                avatar_url: createdCustomer?.avatar_url || avatar_url,
                shop_id: finalShopId,
                branch_id: finalBranchId,
                user_type: 'customer',
                user_id: createdCustomer?.id,
              };
              console.log('JWT request body:', JSON.stringify(jwtRequestBody, null, 2));
              
              const jwtResponse = await fetch(`${API_BASE_URL}/auth/line-login`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(jwtRequestBody),
              });

              console.log('JWT response status:', jwtResponse.status);
              console.log('JWT response headers:', Object.fromEntries(jwtResponse.headers.entries()));

              if (jwtResponse.ok) {
                const jwtData = await jwtResponse.json();
                console.log('JWT response data:', JSON.stringify(jwtData, null, 2));
                
                // Try multiple possible field names for JWT token
                jwtToken = jwtData.token || jwtData.access_token || jwtData.jwt || jwtData.accessToken || null;
                
                if (jwtToken) {
                  console.log('=== JWT TOKEN GENERATED SUCCESSFULLY ===');
                  console.log('JWT token (first 20 chars):', jwtToken.substring(0, 20) + '...');
                } else {
                  console.log('JWT token not found in response. Available keys:', Object.keys(jwtData));
                  console.log('Full response:', jwtData);
                }
              } else {
                const jwtErrorData = await jwtResponse.json().catch(() => ({}));
                console.error('JWT generation failed for new customer');
                console.error('Status:', jwtResponse.status);
                console.error('Error data:', jwtErrorData);
              }
            } catch (jwtError) {
              console.error('=== JWT GENERATION ERROR ===');
              console.error('Error:', jwtError);
              console.error('Error message:', jwtError.message);
              console.error('Error stack:', jwtError.stack);
              console.log('Continuing without JWT token');
            }
          }

          // Get settings to check rate_register_point and add points if > 0
          // ดึง settings จาก /api/customertokenline แทน /settings/:shop_id
          let rateRegisterPoint = 0;
          console.log('=== CHECKING REGISTRATION POINTS ===');
          console.log('finalShopId:', finalShopId);
          console.log('jwtToken:', jwtToken ? 'present' : 'missing');
          console.log('createdCustomer.id:', createdCustomer?.id);
          console.log('line_token:', line_token);
          
          // ต้องมี JWT token, line_token, และ customer id ก่อนถึงจะเพิ่มคะแนน
          if (line_token && createdCustomer?.id && jwtToken) {
            try {
              console.log('=== FETCHING SETTINGS FROM CUSTOMER TOKEN LINE ===');
              console.log('Line token:', line_token);
              console.log('Using JWT token for authorization');
              console.log('JWT token (first 20 chars):', jwtToken.substring(0, 20) + '...');
              console.log('Backend API URL:', `${API_BASE_URL}/customertokenline?line_token=${encodeURIComponent(line_token)}`);
              
              // เรียก /api/customertokenline เพื่อดึง settings
              const customerTokenResponse = await fetch(`${API_BASE_URL}/customertokenline?line_token=${encodeURIComponent(line_token)}`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${jwtToken}`,
                },
              });

              console.log('Customer token response status:', customerTokenResponse.status);
              console.log('Customer token response headers:', Object.fromEntries(customerTokenResponse.headers.entries()));

              if (customerTokenResponse.ok) {
                const customerTokenData = await customerTokenResponse.json();
                console.log('=== CUSTOMER TOKEN DATA RECEIVED ===');
                console.log('Customer token data:', JSON.stringify(customerTokenData, null, 2));
                
                // ดึง settings จาก response
                const settingsData = customerTokenData.settings || {};
                console.log('Settings data:', JSON.stringify(settingsData, null, 2));
                
                const rateRegisterPointValue = settingsData.rate_register_point;
                console.log('rate_register_point (raw):', rateRegisterPointValue, 'type:', typeof rateRegisterPointValue);
                
                // Convert to number, handle empty string, null, undefined
                if (rateRegisterPointValue !== null && rateRegisterPointValue !== undefined && rateRegisterPointValue !== '') {
                  rateRegisterPoint = parseFloat(rateRegisterPointValue);
                  // Check if it's a valid number and not NaN
                  if (isNaN(rateRegisterPoint)) {
                    rateRegisterPoint = 0;
                    console.log('rate_register_point is NaN, setting to 0');
                  }
                } else {
                  rateRegisterPoint = 0;
                  console.log('rate_register_point is empty or invalid, setting to 0');
                }
                
                console.log('rate_register_point (parsed):', rateRegisterPoint, 'type:', typeof rateRegisterPoint);

                // If rate_register_point > 0, add points to customer
                if (rateRegisterPoint > 0) {
                  try {
                    const pointsToAdd = Math.round(rateRegisterPoint);
                    console.log('=== ADDING REGISTRATION POINTS ===');
                    console.log('Customer ID:', createdCustomer.id);
                    console.log('Points to add:', pointsToAdd);
                    console.log('Detail: สมัครสมาชิก');
                    
                    const pointsRequestBody = {
                      customer_id: createdCustomer.id,
                      detail: 'สมัครสมาชิก',
                      points: pointsToAdd,
                    };
                    console.log('Points request body:', JSON.stringify(pointsRequestBody, null, 2));
                    console.log('Using JWT token for authorization');
                    console.log('Backend API URL:', `${API_BASE_URL}/points`);
                    
                    const pointsResponse = await fetch(`${API_BASE_URL}/points`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${jwtToken}`,
                      },
                      body: JSON.stringify(pointsRequestBody),
                    });

                    console.log('Points response status:', pointsResponse.status);
                    console.log('Points response headers:', Object.fromEntries(pointsResponse.headers.entries()));

                    if (pointsResponse.ok) {
                      const pointsResult = await pointsResponse.json().catch(() => ({}));
                      console.log('=== REGISTRATION POINTS ADDED SUCCESSFULLY ===');
                      console.log('Points result:', JSON.stringify(pointsResult, null, 2));
                    } else {
                      const pointsError = await pointsResponse.json().catch(() => ({}));
                      console.error('=== FAILED TO ADD REGISTRATION POINTS ===');
                      console.error('Status:', pointsResponse.status);
                      console.error('Error data:', JSON.stringify(pointsError, null, 2));
                    }
                  } catch (pointsError) {
                    console.error('=== ERROR ADDING REGISTRATION POINTS ===');
                    console.error('Error:', pointsError);
                    console.error('Error message:', pointsError.message);
                    console.error('Error stack:', pointsError.stack);
                  }
                } else {
                  console.log('Skipping points addition - rate_register_point is 0 or less');
                }
              } else {
                const customerTokenErrorData = await customerTokenResponse.json().catch(() => ({}));
                console.error('=== FAILED TO FETCH CUSTOMER TOKEN DATA ===');
                console.error('Status:', customerTokenResponse.status);
                console.error('Error data:', JSON.stringify(customerTokenErrorData, null, 2));
                console.log('Skipping points addition due to customer token API error');
              }
            } catch (settingsError) {
              console.error('=== ERROR FETCHING CUSTOMER TOKEN DATA ===');
              console.error('Error:', settingsError);
              console.error('Error message:', settingsError.message);
              console.error('Error stack:', settingsError.stack);
              console.log('Continuing without adding registration points');
            }
          } else {
            console.log('=== SKIPPING POINTS ADDITION ===');
            console.log('Reason: Missing required data');
            console.log('line_token:', line_token ? 'present' : 'missing (REQUIRED)');
            console.log('jwtToken:', jwtToken ? 'present' : 'missing (REQUIRED)');
            console.log('createdCustomer.id:', createdCustomer?.id ? 'present' : 'missing');
          }

          return NextResponse.json(
            {
              ...createdCustomer,
              name: createdCustomer?.name || name,
              avatar_url: createdCustomer?.avatar_url || avatar_url,
              phone: createdCustomer?.phone || '-', // Ensure phone is set to '-'
              line_token,
              role: 'customer',
              user_type: 'customer',
              shop_id: finalShopId,
              branch_id: finalBranchId,
              shop: createdShop,
              branch: createdBranch,
              created_via: 'qr',
              ...(jwtToken && { token: jwtToken }),
            },
            { status: 201 }
          );
        } catch (createError) {
          console.error('Create customer endpoint error:', createError);
          return NextResponse.json(
            { message: 'ไม่สามารถเชื่อมต่อ API ได้', error: createError.message },
            { status: 500 }
          );
        }
      }

      // No shop_id provided and customer not found
      // This means:
      // 1. Employee check was done first (no employee found)
      // 2. Customer check was done second (no customer found)
      // 3. No shop_id means this is a normal login (not QR registration)
      // So user needs to register at the store
      console.log('=== USER NOT REGISTERED ===');
      console.log('Flow: Employee check -> Customer check -> Both not found');
      console.log('No shop_id provided (normal login, not QR registration)');
      console.log('Returning NOT_REGISTERED error');
      
      return NextResponse.json(
        {
          message: 'ยังไม่ลงทะเบียน กรุณาลงทะเบียนที่หน้าร้าน',
          error_code: 'NOT_REGISTERED',
          line_token: line_token,
        },
        { status: 404 }
      );
    }

    // Customer exists - return customer data with shop and branch info and generate JWT
    console.log('=== CUSTOMER FOUND ===');
    console.log('Customer ID:', customerData.id);
    console.log('Customer Name:', customerData.name);
    console.log('Customer Line Token:', customerData.line_token);
    
    // Extract shop_id and branch_id from customer data or shop/branch objects
    const finalShopId = customerData.shop_id || customerShopData?.id || shop_id || null;
    const finalBranchId = customerData.branch_id || customerBranchData?.id || branch_id || null;
    
    console.log('Shop ID:', finalShopId);
    console.log('Branch ID:', finalBranchId);
    
    // Call backend to generate JWT token for existing customer using NEXT_PUBLIC_API_URL
    let jwtToken = null;
    try {
      console.log('=== CALLING BACKEND /auth/line-login TO GET JWT TOKEN (EXISTING CUSTOMER) ===');
      console.log('Backend URL:', `${API_BASE_URL}/auth/line-login`);
      console.log('Using NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'not set');
      
      const jwtRequestBody = {
        line_token,
        name: name || customerData.name,
        avatar_url: avatar_url || customerData.avatar_url,
        shop_id: finalShopId,
        branch_id: finalBranchId,
        user_type: 'customer',
        user_id: customerData.id,
      };
      console.log('JWT request body (existing customer):', JSON.stringify(jwtRequestBody, null, 2));
      
      const jwtResponse = await fetch(`${API_BASE_URL}/auth/line-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jwtRequestBody),
      });

      console.log('JWT response status (existing customer):', jwtResponse.status);
      console.log('JWT response headers (existing customer):', Object.fromEntries(jwtResponse.headers.entries()));

      if (jwtResponse.ok) {
        const jwtData = await jwtResponse.json();
        console.log('JWT response data (existing customer):', JSON.stringify(jwtData, null, 2));
        
        // Try multiple possible field names for JWT token
        jwtToken = jwtData.token || jwtData.access_token || jwtData.jwt || jwtData.accessToken || null;
        
        if (jwtToken) {
          console.log('=== JWT TOKEN GENERATED SUCCESSFULLY (EXISTING CUSTOMER) ===');
          console.log('JWT token (first 20 chars):', jwtToken.substring(0, 20) + '...');
        } else {
          console.log('JWT token not found in response. Available keys:', Object.keys(jwtData));
          console.log('Full response:', jwtData);
        }
      } else {
        const jwtErrorData = await jwtResponse.json().catch(() => ({}));
        console.error('JWT generation failed for existing customer');
        console.error('Status:', jwtResponse.status);
        console.error('Error data:', jwtErrorData);
      }
    } catch (jwtError) {
      console.error('=== JWT GENERATION ERROR (EXISTING CUSTOMER) ===');
      console.error('Error:', jwtError);
      console.error('Error message:', jwtError.message);
      console.error('Error stack:', jwtError.stack);
      console.log('Continuing without JWT token');
    }
    
    // Return customer data with JWT token if available
    console.log('Returning customer login response...');
    return NextResponse.json({
      ...customerData,
      name: name || customerData.name,
      avatar_url: avatar_url || customerData.avatar_url,
      line_token: line_token,
      role: 'customer',
      user_type: 'customer',
      shop_id: finalShopId,
      branch_id: finalBranchId,
      shop: customerShopData,
      branch: customerBranchData,
      token: jwtToken, // Include JWT token in the response
    }, { status: 200 });
    
    // Fallback: Return data without JWT if backend JWT generation fails
    console.log('Returning customer login response without JWT...');
    return NextResponse.json({
      ...customerData,
      name: name || customerData.name,
      avatar_url: avatar_url || customerData.avatar_url,
      line_token: line_token,
      role: 'customer',
      user_type: 'customer',
      shop_id: finalShopId,
      branch_id: finalBranchId,
      shop: customerShopData,
      branch: customerBranchData,
    }, { status: 200 });
  } catch (error) {
    console.error('=== LINE LOGIN API ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { message: 'ไม่สามารถเชื่อมต่อ API ได้', error: error.message },
      { status: 500 }
    );
  }
}
