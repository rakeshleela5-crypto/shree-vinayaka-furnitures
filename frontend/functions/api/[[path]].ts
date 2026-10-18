interface Env {
  BACKEND_URL?: string;
  RAILWAY_URL?: string;
}

/**
 * Cloudflare Pages Reverse Proxy Function
 * 
 * Proxies https://srivinayakafurnitures.pages.dev/api/* -> Railway FastAPI
 * Benefits:
 * 1. Zero CORS errors & zero OPTIONS preflight latency round-trips
 * 2. Unifies frontend and backend under identical srivinayakafurnitures.pages.dev origin
 * 3. Secure SameSite=Strict cookies without third-party cookie blocking
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  
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
    const backendResponse = await fetch(targetUrl, {
      method: context.request.method,
      headers: forwardHeaders,
      body: context.request.method !== 'GET' && context.request.method !== 'HEAD' ? context.request.body : undefined,
      redirect: 'manual'
    });

    const responseHeaders = new Headers(backendResponse.headers);
    responseHeaders.set('X-Edge-Proxied', 'true');

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
        'Content-Type': 'application/json'
      }
    });
  }
};
