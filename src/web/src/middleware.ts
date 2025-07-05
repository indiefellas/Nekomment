import type { APIRoute, MiddlewareHandler } from "astro";

export const onRequest: MiddlewareHandler = async (context, next) => {
    const response = await next();
    if (!context.url.pathname.startsWith('/c/')) {
      response.headers.append('Content-Security-Policy', `object-src 'none'; frame-ancestors 'self';`)
    }
    if (response.status === 404 && response.headers.get('Content-Type') !== 'text/html') {
      return context.rewrite("/404");
    }
    return response;
}