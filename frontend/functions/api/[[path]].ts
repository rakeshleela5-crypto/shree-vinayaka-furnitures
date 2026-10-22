interface Env {
  BACKEND_URL?: string;
  RAILWAY_URL?: string;
  INTERNAL_API_SECRET?: string;
}

/**
 * Cloudflare Pages Reverse Proxy Function
 * 
 * Proxies https://srivinayakafurnitures.pages.dev/api/* -> Railway FastAPI
 * Benefits:
 * 1. Zero CORS errors & zero OPTIONS preflight latency round-trips
 * 2. Unifies frontend and backend under identical srivinayakafurnitures.pages.dev origin
 * 3. Secure SameSite=Strict cookies without third-party cookie blocking
 * 4. Edge security barrier: blocks unauthorized access to destructive administrative & payout endpoints
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);

  // Defensive Edge Check: Protect destructive administrative & direct bank payout endpoints
  const pathLower = url.pathname.toLowerCase();
  const isProtectedAdminPath = 
    pathLower.includes('/backup/restore') ||
    pathLower.includes('/payouts/initiate') ||
    (pathLower.includes('/auth/users') && context.request.method === 'POST');

  if (isProtectedAdminPath) {
    const adminHeader = context.request.headers.get('X-Admin-Secret') || context.request.headers.get('Authorization');
    const expectedSecret = context.env.INTERNAL_API_SECRET;
    if (expectedSecret && (!adminHeader || (adminHeader !== expectedSecret && adminHeader.replace('Bearer ', '') !== expectedSecret))) {
      return new Response(JSON.stringify({
        error: 'Forbidden',
        detail: 'Cloudflare Edge Guard: Admin authorization required for this endpoint.'
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN'
        }
      });
    }
  }
  
  // Prefer Cloudflare environment variable, or fallback to production Railway FastAPI domain
  const backendBase = 
    context.env.BACKEND_URL || 
    context.env.RAILWAY_URL || 
    'https://shree-vinayaka-furnitures-production.up.railway.app';
  const cleanBase = backendBase.replace(/\/$/, '');
  
  // Forward exact pathname (e.g. /api/v1/sales) and query parameters
  const targetUrl = `${cleanBase}${url.pathname}${url.search}`;

  const forwardHeaders = new Headers(context.request.headers);
  forwardHeaders.set('X-Forwarded-Host', url.host);
  forwardHeaders.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
  forwardHeaders.set('X-Proxied-By', 'Cloudflare-Pages-Edge');

  try {
    let backendResponse = await fetch(targetUrl, {
      method: context.request.method,
      headers: forwardHeaders,
      body: context.request.method !== 'GET' && context.request.method !== 'HEAD' ? context.request.body : undefined,
      redirect: 'follow'
    });

    const responseHeaders = new Headers(backendResponse.headers);
    responseHeaders.set('X-Edge-Proxied', 'true');
    responseHeaders.set('X-Content-Type-Options', 'nosniff');
    responseHeaders.set('X-Frame-Options', 'SAMEORIGIN');
    responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    const locationHeader = responseHeaders.get('location') || responseHeaders.get('Location');
    if (locationHeader) {
      const rewritten = locationHeader.replace(/^https?:\/\/[^/]+/, url.origin);
      responseHeaders.set('Location', rewritten);
    }

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      error: 'Gateway unreachable',
      detail: error?.message || 'Could not reach Railway FastAPI backend'
    }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN'
      }
    });
  }
};
