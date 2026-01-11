'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, QrCode, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { authApi, customerApi } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [useHtml5Qrcode, setUseHtml5Qrcode] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const liffInitializedRef = useRef(false); // Track if LIFF is already initialized

  useEffect(() => {
    // Only initialize LIFF if we're on the login page
    if (typeof window === 'undefined') {
      return;
    }
    
    // Double check pathname before proceeding
    const currentPath = window.location.pathname;
    if (currentPath !== '/crm-customer/login') {
      console.log('Not on login page, skipping LIFF initialization. Current path:', currentPath);
      return;
    }
    
    // Check for code parameter immediately before anything else
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const shopIdFromUrl = urlParams.get('shop_id');
    const branchIdFromUrl = urlParams.get('branch_id');
    
    // Store shop_id and branch_id from URL to localStorage BEFORE login
    if (shopIdFromUrl) {
      console.log('=== STORING SHOP/BRANCH FROM URL ===');
      console.log('Shop ID from URL:', shopIdFromUrl);
      console.log('Branch ID from URL:', branchIdFromUrl);
      localStorage.setItem('shop_id', shopIdFromUrl);
      if (branchIdFromUrl) {
        localStorage.setItem('branch_id', branchIdFromUrl);
      }
    }
    
    if (code) {
      console.log('=== CODE PARAMETER DETECTED ON PAGE LOAD ===');
      console.log('Code:', code);
      console.log('State:', state);
      console.log('Full URL:', window.location.href);
    }
    
    // Initialize LINE Login
    let checkLIFFInterval = null;
    
    // Wait for LIFF SDK to load
    if (window.liff) {
      // Double check we're still on login page before initializing
      if (window.location.pathname === '/crm-customer/login') {
        initializeLIFF();
      }
    } else {
      // Wait for LIFF to be available
      checkLIFFInterval = setInterval(() => {
        // Check pathname on each interval
        if (window.location.pathname !== '/crm-customer/login') {
          clearInterval(checkLIFFInterval);
          return;
        }
        
        if (window.liff) {
          clearInterval(checkLIFFInterval);
          initializeLIFF();
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (checkLIFFInterval) {
          clearInterval(checkLIFFInterval);
        }
        if (!window.liff) {
          console.warn('LIFF SDK not loaded');
        }
      }, 5000);
    }
    
    // Cleanup function
    return () => {
      if (checkLIFFInterval) {
        clearInterval(checkLIFFInterval);
      }
      // Reset initialization flag when component unmounts
      liffInitializedRef.current = false;
    };
  }, []);

  // Check login status after redirect from LINE
  useEffect(() => {
    // Only check if we're on the login page
    if (typeof window === 'undefined') {
      return;
    }
    
    const currentPath = window.location.pathname;
    if (currentPath !== '/crm-customer/login') {
      return;
    }
    
    if (loading) return; // Don't check if already processing login

    const checkLoginAfterRedirect = async () => {
      // Double check we're still on login page
      if (window.location.pathname !== '/crm-customer/login') {
        console.log('Not on login page anymore, aborting redirect check');
        return;
      }
      
      console.log('=== CHECKING LOGIN AFTER REDIRECT ===');
      console.log('Full URL:', window.location.href);
      console.log('Pathname:', window.location.pathname);
      console.log('Search:', window.location.search);
      
      // Check if URL has code parameter (LINE callback)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const liffClientId = urlParams.get('liffClientId');
      const liffRedirectUri = urlParams.get('liffRedirectUri');
      
      console.log('URL params - code:', code ? 'present' : 'missing');
      console.log('URL params - state:', state ? 'present' : 'missing');
      console.log('URL params - liffClientId:', liffClientId);
      console.log('URL params - liffRedirectUri:', liffRedirectUri);
      
      if (typeof window !== 'undefined' && window.liff) {
        try {
          const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
          if (!liffId || liffId.trim() === '') {
            console.log('LIFF ID not configured, skipping check');
            return;
          }

          // Check if LIFF is already initialized
          const isInClient = window.liff.isInClient();
          console.log('Is in LINE client:', isInClient);
          
          // Re-initialize LIFF to get latest login status after redirect
          // LIFF will automatically process the code parameter from URL if present
          console.log('Re-initializing LIFF after redirect...');
          
          // Double check pathname before init
          if (window.location.pathname !== '/crm-customer/login') {
            console.log('Pathname changed before init, aborting');
            return;
          }
          
          // Check if already initialized to prevent duplicate init
          if (liffInitializedRef.current) {
            console.log('LIFF already initialized, skipping re-init in checkLoginAfterRedirect');
            // Still check login status even if already initialized
          } else {
            try {
              liffInitializedRef.current = true;
              await window.liff.init({ liffId });
              console.log('LIFF re-initialized successfully');
            } catch (initError) {
              liffInitializedRef.current = false; // Reset on error
              console.error('LIFF init error in checkLoginAfterRedirect:', initError);
              console.error('Init error message:', initError.message);
              
              // Handle invalid authorization code error
              const errorMessage = (initError.message || '').toLowerCase();
              if (errorMessage.includes('invalid authorization code') || 
                  errorMessage.includes('authorization code') ||
                  errorMessage.includes('invalid_code')) {
                console.error('Authorization code error - clearing URL and asking user to retry');
                
                // Clear expired code from URL
                if (window.location.pathname === '/crm-customer/login') {
                  try {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('code');
                    url.searchParams.delete('state');
                    url.searchParams.delete('liffClientId');
                    url.searchParams.delete('liffRedirectUri');
                    window.history.replaceState({}, '', url.toString());
                    console.log('Cleared expired authorization code from URL');
                    
                    toast.error('รหัสยืนยันตัวตนหมดอายุ กรุณากดปุ่ม "เข้าสู่ระบบด้วย LINE" อีกครั้ง');
                  } catch (urlError) {
                    console.error('Failed to clear URL params:', urlError);
                  }
                }
                return;
              }
              
              // Don't retry automatically to avoid error loops
              console.error('LIFF initialization failed, user should retry manually');
              if (window.location.pathname === '/crm-customer/login') {
                toast.error('ไม่สามารถเชื่อมต่อ LINE Login ได้ กรุณาลองอีกครั้ง');
              }
              return;
            }
          }
          
          // Wait a bit for LIFF to process if code exists
          if (code) {
            console.log('Code parameter found, waiting for LIFF to process...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            // Even without code, wait a bit for LIFF to be ready
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          // Double check pathname before checking login status
          if (window.location.pathname !== '/crm-customer/login') {
            console.log('Pathname changed before checking login status, aborting');
            return;
          }
          
          console.log('Checking login status...');
          const isLoggedIn = window.liff.isLoggedIn();
          console.log('Is logged in after redirect:', isLoggedIn);
          
          // Check if user is logged in after redirect
          if (isLoggedIn) {
            console.log('=== USER IS LOGGED IN AFTER REDIRECT ===');
            console.log('Processing login...');
            // Call handleLineLogin directly
            handleLineLogin();
          } else {
            console.log('User is still not logged in after redirect');
            console.log('This may be normal if user has not clicked login button yet');
            
            // If we had code but still not logged in, try checking again
            if (code) {
              console.log('Code was present but user not logged in - checking again...');
              console.log('This may indicate a LIFF callback URL mismatch');
              // Wait and check multiple times
              for (let i = 1; i <= 3; i++) {
                setTimeout(() => {
                  // Check pathname on each retry
                  if (window.location.pathname !== '/crm-customer/login') {
                    return;
                  }
                  const checkLogin = window.liff.isLoggedIn();
                  if (checkLogin) {
                    console.log(`User logged in on check #${i}`);
                    handleLineLogin();
                  } else {
                    console.log(`Still not logged in on check #${i}`);
                    if (i === 3) {
                      console.log('User still not logged in after multiple checks');
                      console.log('Please verify LIFF callback URL configuration');
                    }
                  }
                }, i * 1500);
              }
            }
          }
        } catch (error) {
          console.error('=== ERROR CHECKING LOGIN STATUS ===');
          console.error('Error:', error);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
      } else {
        console.log('window.liff is not available for checking');
      }
    };

    // Check after LIFF is initialized and page is loaded
    // Check immediately if code parameter exists, otherwise wait
    const urlParams = new URLSearchParams(window.location.search);
    const hasCode = urlParams.get('code');
    const delay = hasCode ? 300 : 2000; // Check faster if code exists
    
    console.log('Setting up login check timer, delay:', delay, 'ms');
    
    const timer = setTimeout(() => {
      checkLoginAfterRedirect();
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const initializeLIFF = () => {
    // Only initialize if we're on the login page
    if (typeof window === 'undefined') {
      console.log('Window is not available, skipping LIFF initialization');
      return;
    }
    
    const currentPath = window.location.pathname;
    if (currentPath !== '/crm-customer/login') {
      console.log('Not on login page, skipping LIFF initialization. Current path:', currentPath);
      return;
    }
    
    // Prevent multiple initialization attempts
    if (liffInitializedRef.current) {
      console.log('LIFF already initialized, skipping');
      return;
    }
    
    console.log('=== INITIALIZE LIFF ===');
    
    if (!window.liff) {
      console.log('window.liff is not available');
      return;
    }
    
    // Check if LIFF is already initialized by checking if isInClient is available
    // Note: Calling isInClient before init may throw error, so we catch it
    let isAlreadyInitialized = false;
    try {
      if (typeof window.liff.isInClient === 'function') {
        // Try to call isInClient - if it works without error, LIFF might be initialized
        const testInClient = window.liff.isInClient();
        console.log('LIFF might be already initialized, isInClient:', testInClient);
        // Note: isInClient can be called before init, so this doesn't guarantee initialization
        // But if it throws error, we know it's not initialized
      }
      if (typeof window.liff.isLoggedIn === 'function') {
        // Try to check login status - if this works, LIFF is likely initialized
        try {
          window.liff.isLoggedIn();
          isAlreadyInitialized = true;
          console.log('LIFF appears to be already initialized (isLoggedIn works)');
          liffInitializedRef.current = true;
        } catch (e) {
          // If isLoggedIn throws error, LIFF is not initialized
          console.log('LIFF not initialized (isLoggedIn failed)');
        }
      }
    } catch (e) {
      // If any error occurs, LIFF is not initialized
      console.log('LIFF not initialized yet, proceeding...');
      isAlreadyInitialized = false;
    }
    
    // If already initialized, skip init
    if (isAlreadyInitialized && liffInitializedRef.current) {
      console.log('LIFF already initialized, skipping init call');
      // Still check login status
      try {
        const isLoggedIn = window.liff.isLoggedIn();
        if (isLoggedIn) {
          console.log('User is already logged in');
          handleLineLogin();
        }
      } catch (e) {
        console.error('Error checking login status:', e);
      }
      return;
    }
    
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    console.log('LIFF ID from env:', liffId ? 'configured' : 'NOT configured');
    
    // Check if LIFF ID is configured
    if (!liffId || liffId.trim() === '') {
      console.error('LIFF ID is not configured. Please set NEXT_PUBLIC_LIFF_ID in environment variables.');
      // Only show toast if we're on the login page
      if (window.location.pathname === '/crm-customer/login') {
        toast.error('LINE Login ยังไม่พร้อมใช้งาน กรุณาตรวจสอบการตั้งค่า LIFF ID');
      }
      return;
    }
    
    console.log('Initializing LIFF with ID:', liffId);
    
    // Check if URL has code parameter (LINE callback) BEFORE init
    // LIFF may clean URL after processing, so check before
    const urlParamsBeforeInit = new URLSearchParams(window.location.search);
    const hasCodeBeforeInit = urlParamsBeforeInit.get('code');
    const stateBeforeInit = urlParamsBeforeInit.get('state');
    
    console.log('URL before LIFF init - code:', hasCodeBeforeInit ? 'present' : 'missing');
    console.log('URL before LIFF init - state:', stateBeforeInit ? 'present' : 'missing');
    console.log('Full URL before init:', window.location.href);
    
    // Double check pathname before calling init
    if (window.location.pathname !== '/crm-customer/login') {
      console.log('Pathname changed before init, aborting');
      return;
    }
    
      // Mark as initializing to prevent multiple calls (but don't set to true yet until success)
      // We'll set it to true only after successful initialization
      
      window.liff.init({
        liffId: liffId,
      }).then(() => {
        // Mark as successfully initialized only after successful init
        liffInitializedRef.current = true;
      // Double check pathname after init
      if (window.location.pathname !== '/crm-customer/login') {
        console.log('Pathname changed after init, aborting');
        return;
      }
      
      // Check URL after init (LIFF may have cleaned it)
      const urlParamsAfterInit = new URLSearchParams(window.location.search);
      const hasCodeAfterInit = urlParamsAfterInit.get('code');
      console.log('URL after LIFF init - code:', hasCodeAfterInit ? 'present' : 'missing');
      console.log('Full URL after init:', window.location.href);
      
      // Check login status - LIFF should have processed code if it existed
      const isLoggedIn = window.liff.isLoggedIn();
      console.log('Is logged in after init:', isLoggedIn);
      
      // If we had code before init, wait a bit for LIFF to process
      if (hasCodeBeforeInit && !isLoggedIn) {
        console.log('Code was present before init but not logged in yet, waiting...');
        // Wait for LIFF to process the code
        setTimeout(() => {
          const isLoggedInAfterWait = window.liff.isLoggedIn();
          console.log('Is logged in after wait:', isLoggedInAfterWait);
          
          if (isLoggedInAfterWait) {
            console.log('User is logged in after wait, calling handleLineLogin...');
            handleLineLogin();
          } else {
            console.log('Still not logged in after wait');
            console.log('This may indicate a LIFF configuration issue');
            console.log('Please check:');
            console.log('1. Callback URL in LINE Developers Console matches current URL');
            console.log('2. LIFF ID is correct');
            console.log('3. LIFF app is published (not in development mode)');
            
            // Try one more time
            setTimeout(() => {
              if (window.liff.isLoggedIn()) {
                console.log('User logged in on second check');
                handleLineLogin();
              } else {
                console.log('Still not logged in - user needs to click login button');
              }
            }, 2000);
          }
        }, 2000); // Increase wait time
      } else if (isLoggedIn) {
        // User is logged in
        console.log('User is logged in, calling handleLineLogin...');
        handleLineLogin();
      } else {
        // No code and not logged in
        console.log('User is not logged in, waiting for login button click');
      }
    }).catch((err) => {
      // Double check pathname FIRST - if not on login page, silently ignore ALL errors
      if (typeof window === 'undefined' || window.location.pathname !== '/crm-customer/login') {
        console.log('LIFF initialization error occurred but not on login page, silently ignoring');
        return;
      }
      
      // Reset initialization flag on error so user can retry
      liffInitializedRef.current = false;
      
      // Check error message first before logging
      const errorMessage = (err?.message || err?.toString() || String(err) || '').toLowerCase();
      const errorName = (err?.name || '').toLowerCase();
      
      // Some errors can be silently ignored
      if (errorName.includes('abort') || 
          errorMessage.includes('aborted') || 
          errorMessage.includes('canceled') ||
          errorMessage.includes('navigation')) {
        console.log('LIFF initialization aborted (non-critical), ignoring error');
        return;
      }
      
      // Log error details for debugging (use warn instead of error for non-critical cases)
      console.warn('=== LIFF INITIALIZATION ERROR ===');
      console.warn('Error type:', typeof err);
      console.warn('Error:', err);
      if (err?.message) console.warn('Error message:', err.message);
      if (err?.name) console.warn('Error name:', err.name);
      if (err?.stack) {
        console.warn('Error stack:', err.stack);
      }
      
      // Handle specific error types
      let userMessage = 'ไม่สามารถเชื่อมต่อ LINE Login ได้ กรุณาตรวจสอบ LIFF ID';
      let shouldShowToast = true;
      
      if (errorMessage.includes('invalid authorization code') || 
          errorMessage.includes('authorization code') ||
          errorMessage.includes('invalid_code')) {
        console.warn('Authorization code error detected');
        userMessage = 'รหัสยืนยันตัวตนหมดอายุหรือไม่ถูกต้อง กรุณากดปุ่ม "เข้าสู่ระบบด้วย LINE" อีกครั้ง';
        
        // Clear any stale code from URL
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          url.searchParams.delete('state');
          url.searchParams.delete('liffClientId');
          url.searchParams.delete('liffRedirectUri');
          window.history.replaceState({}, '', url.toString());
          console.log('Cleared expired authorization code from URL');
        } catch (urlError) {
          console.warn('Failed to clear URL params:', urlError);
        }
      } else if (errorMessage.includes('liff id') || errorMessage.includes('liffid') || errorMessage.includes('invalid liff id')) {
        userMessage = 'LIFF ID ไม่ถูกต้อง กรุณาตรวจสอบการตั้งค่า';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('failed to fetch')) {
        userMessage = 'ไม่สามารถเชื่อมต่อ LINE Server ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
      } else if (errorMessage.includes('already initialized') || errorMessage.includes('already init')) {
        // LIFF might already be initialized, this is not a critical error
        console.log('LIFF already initialized (non-critical)');
        liffInitializedRef.current = true;
        shouldShowToast = false;
        
        // Try to check login status
        try {
          const isLoggedIn = window.liff.isLoggedIn();
          if (isLoggedIn) {
            console.log('User is already logged in after "already initialized" error');
            handleLineLogin();
          }
        } catch (checkError) {
          console.log('Could not check login status:', checkError);
        }
        return;
      } else {
        // Unknown error - log but don't show to user unless it's clearly a user-facing issue
        console.warn('Unknown LIFF initialization error, user can retry manually');
        shouldShowToast = true; // Still show error for unknown cases
      }
      
      // Only show toast if we're on the login page and error is significant
      if (shouldShowToast) {
        toast.error(userMessage);
      }
    });
  };

  const handleLineLogin = async () => {
    console.log('=== HANDLE LINE LOGIN STARTED ===');
    
    try {
      setLoading(true);
      console.log('Getting LINE profile...');

      // Get LINE profile
      const profile = await window.liff.getProfile();
      const idToken = window.liff.getIDToken();
      
      console.log('LINE Profile:', {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl ? 'provided' : 'missing',
      });

      // Get shop_id and branch_id from localStorage (stored from URL on page load)
      // Note: shop_id is required for customers but may be optional for employees
      const shopId = localStorage.getItem('shop_id') || '';
      const branchId = localStorage.getItem('branch_id') || null;
      
      console.log('Shop ID for login:', shopId);
      console.log('Branch ID for login:', branchId);

      // Call LINE login API
      let response;
      try {
        console.log('Calling LINE login API with:', {
          line_token: profile.userId,
          name: profile.displayName,
          shop_id: shopId,
          branch_id: branchId,
        });
        
        response = await authApi.lineLogin(
          profile.userId,
          profile.displayName,
          profile.pictureUrl || '',
          shopId,
          branchId
        );
        
        console.log('LINE login API response:', JSON.stringify(response, null, 2));
      } catch (apiError) {
        console.error('LINE login API error:', apiError);
        console.error('Error status:', apiError.status);
        console.error('Error data:', apiError.data);
        // Handle API errors based on status code
        const status = apiError.status;
        const errorMessage = apiError.message || 'เข้าสู่ระบบไม่สำเร็จ';
        
        // 403 Forbidden - Should not happen for employees anymore, but keep for backward compatibility
        if (status === 403 || (apiError.data && apiError.data.should_create_qr)) {
          toast.error('ไม่สามารถเข้าสู่ระบบได้ กรุณาติดต่อผู้ดูแลระบบ');
          setLoading(false);
          return;
        }
        
        // 404 Not Found - Not registered
        if (status === 404 || (apiError.data && apiError.data.error_code === 'NOT_REGISTERED')) {
          toast.error('ยังไม่ลงทะเบียน กรุณาลงทะเบียนที่หน้าร้าน');
          setLoading(false);
          return;
        }
        
        // Other errors
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      // Determine user type from response
      const userType = response.user_type || response.role || 'customer';
      const isEmployee = userType === 'employee';
      
      console.log('User type determined:', userType, 'isEmployee:', isEmployee);
      console.log('Response ID:', response.id);

      // Store user data with shop_id and branch_id
      // Priority: response.shop_id > response.shop?.id > shopId from URL/localStorage
      const finalShopId = response.shop_id || response.shop?.id || shopId || null;
      const finalBranchId = response.branch_id || response.branch?.id || branchId || null;
        
        const userData = {
        ...response,
        id: response.id || response.data?.id,
        name: response.name || profile.displayName,
        avatar_url: response.avatar_url || profile.pictureUrl,
        line_token: response.line_token || profile.userId,
        phone: response.phone || null,
        otp_verify: response.otp_verify || false,
        role: isEmployee ? 'employee' : 'customer',
        user_type: userType,
        shop_id: finalShopId,
        branch_id: finalBranchId,
        shop: response.shop,
        branch: response.branch,
      };
      
      console.log('User data to store:', JSON.stringify(userData, null, 2));
      console.log('Shop ID to store:', finalShopId);
      console.log('Branch ID to store:', finalBranchId);

      // Store authentication data
      // Use JWT token from backend if available, otherwise use LINE idToken as fallback
      const jwtToken = response.token || response.access_token || response.jwt;
      const authToken = jwtToken || idToken;
      
      console.log('Storing auth token:', jwtToken ? 'JWT token' : 'LINE idToken');
      localStorage.setItem('auth_token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
      
      // Store line_token for later use
      const lineToken = userData.line_token || profile.userId;
      if (lineToken) {
        localStorage.setItem('line_token', lineToken);
        console.log('Line token stored in localStorage:', lineToken);
      }
      
      // Store shop_id and branch_id separately for easy access in other functions
      if (finalShopId) {
        localStorage.setItem('shop_id', finalShopId);
        console.log('Shop ID stored in localStorage:', finalShopId);
      } else {
        console.log('No shop_id to store');
      }
      
      if (finalBranchId) {
        localStorage.setItem('branch_id', finalBranchId);
        console.log('Branch ID stored in localStorage:', finalBranchId);
      } else {
        console.log('No branch_id to store');
      }

      // After login successful, redirect to profile for both employee and customer
      console.log('=== LOGIN SUCCESSFUL ===');
      console.log('Redirecting to profile page...');
      
      // Clean up shop_id and branch_id from URL (keep in localStorage for session)
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has('shop_id') || currentUrl.searchParams.has('branch_id')) {
        currentUrl.searchParams.delete('shop_id');
        currentUrl.searchParams.delete('branch_id');
        window.history.replaceState({}, '', currentUrl.pathname);
        console.log('Cleaned up shop_id/branch_id from URL');
      }

      toast.success('เข้าสู่ระบบสำเร็จ');
      router.push('/crm-customer/profile');
    } catch (error) {
      console.error('=== LINE LOGIN FAILED ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      toast.error(error.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      console.log('=== HANDLE LINE LOGIN FINISHED ===');
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    console.log('=== SCAN QR BUTTON CLICKED ===');
    console.log('Current showQRScanner before set:', showQRScanner);
    console.log('Setting showQRScanner to true');
    setShowQRScanner(true);
    console.log('setShowQRScanner(true) called');
    
    // Check state after a short delay
      setTimeout(() => {
      console.log('showQRScanner state after delay:', showQRScanner);
    }, 100);
  };

  const closeQRScanner = async () => {
    console.log('=== CLOSE QR SCANNER ===');
    setScanning(false);
    
    // Stop html5-qrcode scanner
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch (error) {
        console.error('Error stopping QR scanner:', error);
      }
      html5QrCodeRef.current = null;
    }
    
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    console.log('Setting showQRScanner to false');
    setShowQRScanner(false);
  };

  const startQRScanner = async () => {
    if (!showQRScanner) return;

    try {
      setScanning(true);

      // Wait for DOM element to be ready
      const waitForElement = (id, maxAttempts = 20) => {
        return new Promise((resolve, reject) => {
          let attempts = 0;
          const checkElement = () => {
            const element = document.getElementById(id);
            if (element) {
              resolve(element);
            } else if (attempts < maxAttempts) {
              attempts++;
              setTimeout(checkElement, 100);
            } else {
              reject(new Error(`Element with id=${id} not found after ${maxAttempts} attempts`));
            }
          };
          checkElement();
        });
      };

      // Use html5-qrcode library if available
      if (typeof window !== 'undefined' && window.Html5Qrcode) {
        setUseHtml5Qrcode(true);
        
        // Wait for element to be ready
        await waitForElement('qr-reader');
        
        const html5QrCode = new window.Html5Qrcode('qr-reader');
        html5QrCodeRef.current = html5QrCode;
        
        html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // QR code scanned successfully
            handleQRCodeScanned(decodedText);
          },
          (errorMessage) => {
            // Ignore scanning errors (will be called frequently)
          }
        ).catch((err) => {
          console.error('QR Scanner error:', err);
          toast.error('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการเข้าถึงกล้อง');
          closeQRScanner();
        });
      } else {
        setUseHtml5Qrcode(false);
        
        // Fallback: Use manual QR code scanning with jsQR
        // Wait for video element to be ready
        await waitForElement('qr-reader-video');
        
        // Request camera access manually
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        
        scanQRCodeManually();
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการเข้าถึงกล้อง');
      closeQRScanner();
    }
  };

  const scanQRCodeManually = () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    const scanInterval = setInterval(() => {
      if (!videoRef.current || !showQRScanner) {
        clearInterval(scanInterval);
        return;
      }

      try {
        const video = videoRef.current;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          // Use jsQR if available
          if (typeof window !== 'undefined' && window.jsQR) {
            const code = window.jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
              clearInterval(scanInterval);
              handleQRCodeScanned(code.data);
            }
          }
        }
      } catch (error) {
        console.error('Scan error:', error);
      }
    }, 100);
  };

  const handleQRCodeScanned = (qrData) => {
    console.log('QR Code scanned:', qrData);
    
    try {
      // Parse QR code data (should be a URL with shop_id and branch_id)
      const url = new URL(qrData);
      const shopId = url.searchParams.get('shop_id');
      const branchId = url.searchParams.get('branch_id');
      
      if (shopId) {
        // Store shop_id and branch_id in localStorage
        localStorage.setItem('shop_id', shopId);
        if (branchId) {
          localStorage.setItem('branch_id', branchId);
        }
        
        // Close scanner
        closeQRScanner();
        
        // Redirect to login page with shop_id and branch_id
        const redirectUrl = `/crm-customer/login?shop_id=${shopId}${branchId ? `&branch_id=${branchId}` : ''}`;
        router.push(redirectUrl);
        
        toast.success('แสกน QR Code สำเร็จ กรุณาเข้าสู่ระบบด้วย LINE');
      } else {
        toast.error('QR Code ไม่ถูกต้อง กรุณาแสกน QR Code ที่พนักงานสร้างให้');
      }
    } catch (error) {
      console.error('QR Code parse error:', error);
      toast.error('QR Code ไม่ถูกต้อง กรุณาแสกน QR Code ที่พนักงานสร้างให้');
    }
  };

  useEffect(() => {
    console.log('=== QR SCANNER EFFECT ===');
    console.log('showQRScanner:', showQRScanner);
    
    if (showQRScanner) {
      console.log('Dialog should be open, loading libraries...');
      // Small delay to ensure Dialog is fully rendered
      const timer = setTimeout(() => {
        console.log('Timer fired, starting to load libraries');
        // Load QR code scanning libraries
        const loadLibraries = async () => {
          // Try to load html5-qrcode
          if (typeof window !== 'undefined' && !window.Html5Qrcode) {
            // Check if script already exists
            let script1 = document.getElementById('html5-qrcode-script');
            if (!script1) {
              script1 = document.createElement('script');
              script1.id = 'html5-qrcode-script';
              script1.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
              script1.onload = () => {
                // Wait a bit more for the library to be fully initialized
                setTimeout(() => {
                  if (window.Html5Qrcode) {
                    startQRScanner();
                  }
                }, 200);
              };
              script1.onerror = () => {
                // Fallback to jsQR
                loadJsQR();
              };
              document.body.appendChild(script1);
            } else {
              // Script already loaded, wait for element
              setTimeout(() => startQRScanner(), 200);
            }
          } else {
            // Library already available, wait for element
            setTimeout(() => startQRScanner(), 200);
          }
        };

        const loadJsQR = () => {
          if (typeof window !== 'undefined' && !window.jsQR) {
            let script2 = document.getElementById('jsqr-script');
            if (!script2) {
              script2 = document.createElement('script');
              script2.id = 'jsqr-script';
              script2.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
              script2.onload = () => {
                setTimeout(() => startQRScanner(), 200);
              };
              document.body.appendChild(script2);
            } else {
              setTimeout(() => startQRScanner(), 200);
            }
          } else {
            setTimeout(() => startQRScanner(), 200);
          }
        };

        loadLibraries();
      }, 300); // Wait 300ms for Dialog to render

      return () => {
        console.log('Cleaning up timer');
        clearTimeout(timer);
      };
    }
    // No cleanup needed when showQRScanner is false - Dialog will handle closing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQRScanner]);

  const handleLineLoginClick = async () => {
    console.log('=== LOGIN BUTTON CLICKED ===');
    
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    
    // Check if LIFF ID is configured
    if (!liffId || liffId.trim() === '') {
      console.error('LIFF ID not configured');
      toast.error('LINE Login ยังไม่พร้อมใช้งาน กรุณาตรวจสอบการตั้งค่า LIFF ID ใน environment variables');
      return;
    }
    
    if (typeof window !== 'undefined' && window.liff) {
      try {
        console.log('Checking LIFF login status...');
        
        // Ensure LIFF is initialized
        if (!window.liff.isInClient() && !window.liff.isLoggedIn()) {
          console.log('Initializing LIFF before login...');
          await window.liff.init({ liffId });
        }

        const isLoggedIn = window.liff.isLoggedIn();
        console.log('Is logged in:', isLoggedIn);

        if (isLoggedIn) {
          // User is already logged in, process login
          console.log('User is already logged in, processing login...');
          handleLineLogin();
        } else {
          // User is not logged in, redirect to LINE login
          console.log('=== REDIRECTING TO LINE LOGIN ===');
          console.log('Current URL:', window.location.href);
          setLoading(true);
          
          // Use login() without redirectUri to use default callback
          window.liff.login();
        }
      } catch (error) {
        console.error('=== LIFF LOGIN ERROR ===');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        toast.error('ไม่สามารถเข้าสู่ระบบ LINE ได้ กรุณาตรวจสอบ LIFF ID');
        setLoading(false);
      }
    } else {
      console.error('window.liff is not available');
      // Fallback: If LIFF is not available, show error
      toast.error('LINE Login ไม่พร้อมใช้งาน กรุณาตรวจสอบการตั้งค่า LIFF ID');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-border bg-card p-8 shadow-lg mx-auto">
        <div className="flex flex-col items-center space-y-2">
          <div className="rounded-full bg-primary/10 p-3">
            <LogIn className="size-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">เข้าสู่ระบบ</h1>
          <p className="text-sm text-muted-foreground text-center">
            เข้าสู่ระบบด้วย LINE Login
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            type="button" 
            className="w-full bg-[#06C755] hover:bg-[#05B048] text-white" 
            onClick={handleLineLoginClick}
            disabled={loading}
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย LINE'}
          </Button>
          
          <Button 
            type="button" 
            variant="outline"
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('=== SCAN QR BUTTON CLICKED ===');
              console.log('loading:', loading);
              console.log('scanning:', scanning);
              if (!loading && !scanning) {
                handleScanQR();
              } else {
                console.log('Button is disabled');
              }
            }}
            disabled={loading || scanning}
          >
            <QrCode className="mr-2 h-4 w-4" />
            {scanning ? 'กำลังแสกน...' : 'แสกนเพื่อลงทะเบียน'}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            โดยการเข้าสู่ระบบ คุณยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว
          </p>
        </div>
      </div>

      {/* QR Code Scanner Dialog */}
      {showQRScanner && (
        <Dialog 
          open={showQRScanner} 
          onOpenChange={(open) => {
            console.log('Dialog onOpenChange called with:', open);
            console.log('Current showQRScanner state:', showQRScanner);
            if (!open) {
              console.log('Dialog is closing, calling closeQRScanner');
              closeQRScanner();
            } else {
              console.log('Dialog is opening, setting showQRScanner to true');
              setShowQRScanner(open);
            }
          }}
        >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>แสกน QR Code</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden">
              {useHtml5Qrcode ? (
                <div id="qr-reader" className="w-full h-full"></div>
              ) : (
                <video
                  ref={videoRef}
                  id="qr-reader-video"
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
              )}
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-primary rounded-lg w-64 h-64"></div>
                  </div>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              กรุณาแสกน QR Code ที่พนักงานสร้างให้
            </p>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={closeQRScanner}
            >
              <X className="mr-2 h-4 w-4" />
              ปิด
            </Button>
      </div>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}
