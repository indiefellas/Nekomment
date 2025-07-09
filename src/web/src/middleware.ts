import type { APIRoute, MiddlewareHandler } from "astro";

export const onRequest: MiddlewareHandler = async (context, next) => {
    const response = await next();
    if (!context.url.pathname.startsWith('/c/')) {
      response.headers.append('Content-Security-Policy', `object-src 'none'; frame-ancestors 'self'; upgrade-insecure-requests;`)
    }
    if (response.status === 404 && response.headers.get('Content-Type') !== 'text/html') {
      return context.rewrite("/404");
    }
    response.headers.append('X-Content-Type-Options', 'nosniff');
    response.headers.append('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    response.headers.append('Referrer-Policy', 'no-referrer-when-downgrade');
    response.headers.append('Referrer-Policy', 'no-referrer-when-downgrade');
    return response;
}