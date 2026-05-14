import { createOpenAI, openai } from "@ai-sdk/openai";

/** DeepSeek 官方 OpenAI 兼容接口根路径 */
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";

/**
 * 解析环境变量，返回用于 chat completions 的语言模型（DeepSeek 优先，否则 OpenAI）。
 * 与 `/api/chat` 共用，避免两处配置漂移。
 */
export function resolveChatLanguageModel() {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (deepseekKey) {
    const deepseek = createOpenAI({
      apiKey: deepseekKey,
      baseURL: DEEPSEEK_BASE_URL,
      name: "deepseek",
    });
    const modelId = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
    return deepseek.chat(modelId);
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    const modelId = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    return openai.chat(modelId);
  }

  return null;
}
