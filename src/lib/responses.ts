export function text(value: string, status: number): Response {
    return new Response(value, {
        status: status
    })
}