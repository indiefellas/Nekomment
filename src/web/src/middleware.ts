import type { APIRoute, MiddlewareHandler } from "astro";

export const onRequest: MiddlewareHandler = async (context, next) => {
    const response = await next();
    if (response.status === 404 && response.headers.get('Content-Type') !== 'text/html') {
      return context.rewrite("/404");
    }
    return response;
}