/**
 * AI SDK 在「恢复流」时会向 `/api/chat/:id/stream` 发 GET。
 * 本项目未启用持久流恢复，这里统一返回 204，避免误请求时出现 404 正文「Not Found」。
 */
export async function GET() {
  return new Response(null, { status: 204 });
}
