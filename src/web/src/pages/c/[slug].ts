import type { APIRoute } from "astro";
import { Handlebars } from "handlebars-jle";
import sanitizeHTML from 'sanitize-html';

export function genId(length: number) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export function genDefaultTemplate(page: string) {
    return `<h1>{{name}}'s Comment Page</h1>
<p>This is the default Nekomment Pages layout and styling! Edit it in your dashboard!</p>

{{{Editor context}}}

<section>
    {{#each comments}}
        <article>
            <h2><a href={{this.website}}>{{this.author}}</a></h2>
            <p>{{this.content}}</p>
            {{{ReplyButton this}}}
            {{#each replies}}
                <blockquote>
                    <h3><a href={{this.website}}>{{this.author}}</a></h3>
                    <p>{{this.content}}</p>
                </blockquote>
            {{/each}}
        </article>
    {{/each}}
</section>

<style>
    /* See https://docs.beta.cmt.nkko.link/Pages/Styling for more info */
    @import url(/_assets/pagesDefault.css)
</style>`
}

function genBoilerplate(output: string, name: string, id: string) {
    return /*html*/`
<html>
    <head>
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
        </script>
    </head>
    <body>
        ${output}
        <p style="margin-top: 12px; margin-inline: auto; display: block !important; position: static !important;">Powered by <a href="/">Nekomment</a></p>
    </body>
</html>
`
}

export const GET: APIRoute = async ({ params, request, locals }) => {
    let id = genId(24);

    const hbs = new Handlebars({ interpreted: true });
    hbs.engine.addMethod('Editor', function (value) {
        console.log(value);
        return (/*html*/`<form method="POST" action="https://api.beta.cmt.nkko.link/v1/comments/${value[0].host}/${encodeURIComponent(value[0].path)}" referrerpolicy="unsafe-url">
                <div>
                    <input type="text" name="name" placeholder="Display name" aria-label="Display name" required />
                    <input type="url" name="website" placeholder="Website" aria-label="Website" />
                </div>
                <textarea name="content" placeholder="Your comment..." aria-label="Your comment"></textarea>
                <button>Comment</button>
                <input type="hidden" id="parentid" name="parentId" value="">
                <input type="hidden" name="backPath" value="${value[0].backpath}">
                <p id="parentname"></p>
            </form>`)
    }, {})

    hbs.engine.addMethod('ReplyButton', (value) => {
        return (/*html*/`<button data-nkm-id="${value[0].id}" data-nkm-author="${value[0].author}">Reply</button>`)
    })

    if (!params.slug) return new Response('Page not found', { status: 404 });
    const path = request.headers.get('Referer') || '';
    const pathUrl = path ? new URL(path) : new URL('https://beta.cmt.nkko.link/');
    const pageRes = await locals.runtime.env.NEKOMMENT_API.getPage(params.slug, pathUrl.pathname);
    const page = pageRes.data;
    if (!page || !pageRes.success) {
        return new Response(pageRes.message, { status: 404 });
    }
    const template = hbs.compile(page.template);
    let context = {
        name: page.name,
        comments: page.comments.reverse().map(c => ({
            ...c,
            replies: c.replies.reverse()
        })),
        context: {
            host: page.hostName,
            path: page.useReferer ? new URL(path).pathname : page.pagePath,
            backpath: 'https://beta.cmt.nkko.link/c/' + page.name
        }
    };
    let out = genBoilerplate(template(context), params.slug || 'Nekomment Pages', id);
    return new Response(
        out,
        {
            headers: {
                'Content-Type': 'text/html',
                'Content-Security-Policy': `script-src 'self' 'nonce-nkm-${id}' https://*; object-src none; frame-ancestors 'self' https://${page.hostName}`
            }
        }
    )
}