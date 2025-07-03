import type { APIRoute } from "astro";
import { Handlebars } from "handlebars-jle";
import sanitizeHTML from 'sanitize-html';
import lodash from "lodash";
const { chunk } = lodash;
import { site } from "astro:config/server";

export function genId(length: number) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function genBoilerplate(output: string, name: string, id: string, turnstileKey: string) {
    return /*html*/`
<!DOCTYPE html>
<html lang="en">
    <head>
        <link rel="stylesheet" href="/_assets/pagesDefault.css" />
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.svg" />
        <title>${name} - Nekomment</title>
        <script nonce="nkm-${id}">
            document.addEventListener('DOMContentLoaded', () => {
                document.querySelectorAll('[data-nkm-id]').forEach(e => {
                    e.addEventListener('click', () => {
                        document.getElementById('parentname').textContent = 'Replying to ' + e.dataset.nkmAuthor + '...';
                        document.getElementById('parentid').value = e.dataset.nkmId;
                    })
                })
            })

            window.onTurnstileLoad = () => {
                const editor = document.querySelector('.nkm-editor');
                document.querySelectorAll('.nkm-button').forEach(e => {
                    e.removeAttribute('disabled');
                })

                const submitButton = editor.querySelector('.nkm-button');
                editor.addEventListener('submit', ev => {
                    ev.preventDefault();
                    submitButton.setAttribute('disabled', 'true');
                    turnstile.render('.nkm-cfTurnstile', {
                        sitekey: "${turnstileKey}",
                        callback: (token) => {
                            document.querySelector('.nkm-cfTurnstile').style.display = 'none';
                            editor.querySelector('#cf-turnstile').value = token;
                            submitButton.removeAttribute('disabled');
                            editor.submit();
                        }
                    })
                })
            }
        </script>
        <script nonce="nkm-${id}" src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad" async defer></script>
    </head>
    <body>
        ${output}
        <p style="margin-top: 12px; margin-inline: auto; display: block !important; position: static !important;">Powered by <a href="/">Nekomment</a></p>
    </body>
</html>
`
}

export const GET: APIRoute = async ({ params, request, locals, url }) => {
    let id = genId(24);

    if (!params.slug) return new Response('Page not found', { status: 404 });
    const path = request.headers.get('Referer') || '';
    const pathUrl = path ? new URL(path) : new URL('https://beta.cmt.nkko.link/');
    const pageNum = parseInt(url.searchParams.get('page') || "1", 10);

    const cache = await locals.runtime.caches.open(`nkm-cache:${params.slug}:${pageNum}`);
    const cacheRes = await cache.match(request);
    if (cacheRes) {
        return cacheRes
    }

    const hbs = new Handlebars({ interpreted: true });
    hbs.engine.addMethod('Editor', function (value) {
        return (/*html*/`
            <noscript>
                <style>
                    .nkm-editor, .nkm-button {
                        display: none !important;
                    }
                </style>
                <div class="nkm-error">
                    <p>To comment, you need to have JavaScript enabled.</p>
                </div>
            </noscript>
            <form class="nkm-editor" method="POST" action="${value[0].apiUrl}v1/comments/${value[0].host}/${encodeURIComponent(value[0].path)}">
                <div class="nkm-topInput">
                    <input type="text" name="name" placeholder="Display name" aria-label="Display name" required />
                    <input type="url" name="website" placeholder="Website (optional)" aria-label="Website (optional)" />
                </div>
                <textarea name="content" placeholder="Your comment..." aria-label="Your comment" required></textarea>
                
                <input type="hidden" id="parentid" name="parentId" value="">
                <input type="hidden" name="backPath" value="${value[0].backpath}">
                <input type="hidden" id="cf-turnstile" name="cfTurnstileKey">
                <div class="nkm-buttons">
                    <div>
                        <p id="parentname"></p>
                        <div class="nkm-cfTurnstile"></div>
                    </div>
                    <button class="nkm-button nkm-comment" disabled>Comment</button>
                </div>
            </form>`)
    }, {})

    hbs.engine.addMethod('ReplyButton', (value) => {
        return (/*html*/`<button class="nkm-button nkm-reply" data-nkm-id="${value[0].id}" data-nkm-author="${value[0].author}" disabled>Reply</button>`)
    })

    hbs.engine.addMethod('PageButtons', (value) => {
        return (/*html*/`
            <div class="nkm-pages">
                <a class="nkm-link" href="${"?page=" + (value[0].page - 1)}">${value[0].totalPages > 1 && value[0].page > 1 ? `Previous page` : ''}</a>
                <p>Pages ${value[0].page} of ${value[0].totalPages} (${value[0].totalComments} total comments)</p>
                <a class="nkm-link" href="${"?page=" + (value[0].page + 1)}"">${value[0].totalPages > 1 && value[0].page < value[0].totalPages ? `Next page` : ''}</a>
            </div>
        `)
    })

    const pageRes = await locals.runtime.env.NEKOMMENT_API.getPage(params.slug, pathUrl.pathname);
    const page = pageRes.data;
    if (!page || !pageRes.success) {
        return new Response(pageRes.message, { status: 404 });
    }
    const sanitized = sanitizeHTML(page.template, {
        allowVulnerableTags: true,
        allowedTags: sanitizeHTML.defaults.allowedTags.concat(['img', 'style']),
        allowedAttributes: {
            ...sanitizeHTML.defaults.allowedAttributes,
            '*': ['class', 'id', 'src', 'style']
        },
    })
    const template = hbs.compile(sanitized);
    const comments = chunk(page.comments.reverse().map(c => ({
        ...c,
        replies: c.replies.reverse()
    })), 10);
    let context = {
        name: page.name,
        comments: comments[pageNum - 1],
        context: {
            host: page.hostName,
            path: page.useReferer ? new URL(path).pathname : page.pagePath,
            backpath: site + '/c/' + page.name,
            page: pageNum,
            totalPages: comments.length,
            totalComments: page.comments.length,
            apiUrl: locals.runtime.env.API_URL,
            turnstileSiteKey: locals.runtime.env.TURNSTILE_KEY
        }
    };
    let out = genBoilerplate(template(context), params.slug || 'Nekomment Pages', id, locals.runtime.env.TURNSTILE_KEY);
    let res = new Response(
        out,
        {
            headers: {
                'Content-Type': 'text/html',
                'Content-Security-Policy': `script-src 'self' 'nonce-nkm-${id}' https://challenges.cloudflare.com; object-src 'none'; frame-ancestors 'self' https://${page.hostName}; base-uri 'self'; style-src 'self' 'unsafe-inline';`
            }
        }
    );
    await cache.put(request, res)
    return res;
}