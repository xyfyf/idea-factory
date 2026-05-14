/**
 * 健康检查：浏览器访问 GET /api/health 应返回 JSON。
 * 若此处也是 404，说明当前端口上的不是本项目或需重启开发服务。
 */
export function GET() {
  return Response.json({ ok: true, service: "idea-factory" });
}
