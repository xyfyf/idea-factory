import { convertToModelMessages, generateText, safeValidateUIMessages, type UIMessage } from "ai";
import type { AppLocale } from "@/lib/i18n/messages";
import { resolveChatLanguageModel } from "@/lib/ai-model";
import { getPrdWriterSystemPrompt } from "@/lib/prompts/prd-writer-from-chat-system";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * 根据需求澄清对话，一次性生成完整 PRD（Markdown 正文）。
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

    locale = body.locale === "en" ? "en" : "zh";
    const { messages } = body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: locale === "en" ? "Need a non-empty messages array." : "需要非空的对话消息。" },
        { status: 400 }
      );
    }

    const model = resolveChatLanguageModel();
    if (!model) {
      return Response.json(
        {
          error:
            locale === "en"
              ? "No API key. Set DEEPSEEK_API_KEY or OPENAI_API_KEY in .env.local."
              : "未配置 DEEPSEEK_API_KEY 或 OPENAI_API_KEY。",
        },
        { status: 503 }
      );
    }

    const validated = await safeValidateUIMessages({ messages });
    if (!validated.success) {
      return Response.json(
        {
          error:
            locale === "en"
              ? `Invalid messages: ${validated.error.message}`
              : `消息无效：${validated.error.message}`,
        },
        { status: 400 }
      );
    }

    const modelMessages = [...(await convertToModelMessages(validated.data as UIMessage[]))];
    modelMessages.push({
      role: "user",
      content:
        locale === "en"
          ? "Based on the full conversation above, output the complete PRD in Markdown exactly as specified in the system message."
          : "请根据以上完整对话，严格按系统消息中的规范输出完整 PRD（Markdown）。",
    });

    const { text } = await generateText({
      model,
      system: getPrdWriterSystemPrompt(locale),
      messages: modelMessages,
      maxOutputTokens: 8192,
    });

    const trimmed = text?.trim() ?? "";
    if (!trimmed) {
      return Response.json(
        { error: locale === "en" ? "Model returned empty PRD." : "模型返回的 PRD 为空。" },
        { status: 502 }
      );
    }

    return Response.json({ prd: trimmed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/prd/generate]", e);
    return Response.json(
      { error: locale === "en" ? `Generate failed: ${msg}` : `生成失败：${msg}` },
      { status: 500 }
    );
  }
}
