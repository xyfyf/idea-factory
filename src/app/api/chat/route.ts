import {
  convertToModelMessages,
  safeValidateUIMessages,
  streamText,
} from "ai";
import { resolveChatLanguageModel } from "@/lib/ai-model";
import type { AppLocale } from "@/lib/i18n/messages";
import { getSocraticSystemPrompt } from "@/lib/prompts/socratic-pm-system";

/** 确保路由不被静态化缓存（对话依赖请求体与运行时环境变量） */
export const dynamic = "force-dynamic";

/** Vercel 等平台上的流式响应超时上限（秒），可按托管商限制调整 */
export const maxDuration = 60;

function parseLocale(v: unknown): AppLocale {
  return v === "en" ? "en" : "zh";
}

/**
 * 对话接口：接收前端发来的 UI 消息列表，流式返回「苏格拉底式 PM」回复。
 */
export async function POST(req: Request) {
  let locale: AppLocale = "zh";
  try {
    let body: { messages?: unknown; locale?: unknown };
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "请求体不是合法的 JSON。" }, { status: 400 });
    }

    locale = parseLocale(body.locale);

    const model = resolveChatLanguageModel();
    if (!model) {
      const msg =
        locale === "en"
          ? "No API key configured. Set DEEPSEEK_API_KEY (recommended) or OPENAI_API_KEY in .env.local."
          : "服务器未配置可用的对话密钥。请在 .env.local 中配置 DEEPSEEK_API_KEY（推荐）或 OPENAI_API_KEY。";
      return Response.json({ error: msg }, { status: 503 });
    }

    const { messages } = body;
    if (!Array.isArray(messages)) {
      return Response.json(
        { error: locale === "en" ? "Missing messages array." : "缺少 messages 数组。" },
        { status: 400 }
      );
    }

    const validated = await safeValidateUIMessages({ messages });
    if (!validated.success) {
      const detail = validated.error.message;
      const msg =
        locale === "en"
          ? `Invalid message format. Tap "Clear chat" and try again. ${detail}`
          : `消息格式无效，请点「清空对话」后重试。详情：${detail}`;
      return Response.json({ error: msg }, { status: 400 });
    }

    const modelMessages = await convertToModelMessages(validated.data);

    const result = streamText({
      model,
      system: getSocraticSystemPrompt(locale),
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/chat]", e);
    const text =
      locale === "en" ? `Server error: ${msg}` : `服务端异常：${msg}`;
    return Response.json({ error: text }, { status: 500 });
  }
}
