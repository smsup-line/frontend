import { NextResponse } from 'next/server';

const BLOCKED_IPS = new Set([
  '31.58.226.146',
  '107.175.89.136',
  '87.121.84.24',
  '176.65.132.224',
  '205.185.127.97',
  '66.96.20.147',
]);

const SCANNER_PATHS = [
  /^\/_next\/image\/?$/i,
  /^\/\.env/i,
  /^\/\.git/i,
  /^\/\.aws/i,
  /^\/wp-/i,
  /^\/wordpress/i,
  /^\/xmlrpc\.php/i,
  /^\/phpmyadmin/i,
  /^\/vendor\/phpunit/i,
  /^\/cgi-bin/i,
  /^\/actuator/i,
  /^\/server-status/i,
  /^\/_ignition/i,
  /^\/debug\//i,
];

const RSC_EXPLOIT_PATTERNS = [
  '__proto__',
  'constructor:constructor',
  ':constructor',
  'child_process',
  'spawnSync',
  'returnNaN',
  'process.mainModule',
  'require("child_process")',
  '/nuts/poop',
];

const WINDOW_MS = 60_000;
const MAX_REQ_PER_MIN = 180;
const MAX_POST_PER_MIN = 40;
const MAX_AUTH_PER_MIN = 20;
const buckets = new Map();

function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    ''
  );
}

function applySecurityHeaders(response) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  return response;
}

function forbid() {
  return applySecurityHeaders(new NextResponse('Forbidden', { status: 403 }));
}

function tooMany(retryAfter) {
  const response = new NextResponse('Too Many Requests', { status: 429 });
  response.headers.set('Retry-After', String(retryAfter));
  return applySecurityHeaders(response);
}

function rateLimit(ip, limit) {
  const now = Date.now();
  const key = `${ip}:${limit}`;
  const current = buckets.get(key);

  if (!current || now > current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (buckets.size > 8000) {
      for (const [mapKey, value] of buckets) {
        if (now > value.resetAt) buckets.delete(mapKey);
      }
    }
    return { ok: true, retryAfter: 0 };
  }

  current.count += 1;
  if (current.count > limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  return { ok: true, retryAfter: 0 };
}

function authLimitPath(pathname) {
  return (
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/check-otp') ||
    pathname.startsWith('/api/line-login')
  );
}

export async function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const clientIp = getClientIp(request);

  if (clientIp && BLOCKED_IPS.has(clientIp)) {
    console.warn(`[SECURITY] Blocked IP ${clientIp} → ${pathname}`);
    return forbid();
  }

  if (SCANNER_PATHS.some((pattern) => pattern.test(pathname))) {
    console.warn(`[SECURITY] Blocked scanner path from ${clientIp || 'unknown'} → ${pathname}`);
    return forbid();
  }

  const suspicious = `${pathname}?${search}`.toLowerCase();
  if (
    suspicious.includes('__proto__') ||
    suspicious.includes('constructor.prototype') ||
    suspicious.includes('child_process')
  ) {
    return forbid();
  }

  const limit = authLimitPath(pathname)
    ? MAX_AUTH_PER_MIN
    : request.method !== 'GET' && request.method !== 'HEAD'
      ? MAX_POST_PER_MIN
      : MAX_REQ_PER_MIN;

  const limited = rateLimit(clientIp || 'unknown', limit);
  if (!limited.ok) {
    return tooMany(limited.retryAfter);
  }

  const method = request.method;
  const contentType = request.headers.get('content-type') || '';
  const nextAction = request.headers.get('next-action');
  const routerState = request.headers.get('next-router-state-tree');
  const rscHeader = request.headers.get('rsc');

  if (method === 'POST' && (nextAction || routerState || rscHeader === '1')) {
    try {
      const body = await request.clone().text();
      const bodyLower = body.toLowerCase();
      const isExploit = RSC_EXPLOIT_PATTERNS.some((pattern) => bodyLower.includes(pattern.toLowerCase()));

      if (isExploit || (nextAction && contentType.includes('multipart/form-data'))) {
        console.warn(
          `[SECURITY] Blocked RSC exploit probe from ${clientIp || 'unknown'} → ${pathname}`
        );
        return forbid();
      }
    } catch {
      return forbid();
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
