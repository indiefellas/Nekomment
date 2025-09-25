import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeSanitize from 'rehype-sanitize';
import rehypeExternalLinks from 'rehype-external-links';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const processor = unified()
    .use(remarkGfm)
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeRaw)
    .use(rehypeSanitize)
    .use(rehypeExternalLinks, {
        rel: ['nofollow', 'noopener', 'noreferrer']
    })
    .use(rehypeStringify, { allowDangerousHtml: true });

export async function parseMarkdown(markdown: string) {
    const file = await processor.process(markdown);
    return String(file);
}
