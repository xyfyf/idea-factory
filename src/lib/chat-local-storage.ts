import type { UIMessage } from "ai";

/** 浏览器 localStorage 键名：与产品名绑定，后续若消息结构不兼容可改版本号 */
export const CHAT_STORAGE_KEY = "idea-factory:socratic-chat:v1";

/** 判断助手消息是否已有可见文本（用于丢弃未完成的流式占位） */
function assistantHasVisibleText(m: UIMessage): boolean {
  return m.parts.some(
    (p) => p.type === "text" && typeof (p as { text?: string }).text === "string" && (p as { text: string }).text.trim().length > 0
  );
}

/**
 * 将 localStorage 里读出的原始数据整理为可用的 UIMessage[]：
 * - 丢弃结构不完整的消息；
 * - 去掉末尾「空助手」记录（常见于上次请求中断，易导致服务端 convert 失败）。
 */
function normalizeStoredChatMessages(raw: unknown[]): UIMessage[] {
  const coerced: UIMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const m = item as Partial<UIMessage> & { content?: unknown };
    if (typeof m.id !== "string") continue;
    if (m.role !== "user" && m.role !== "assistant" && m.role !== "system") continue;

    let parts = m.parts;
    if (!Array.isArray(parts) || parts.length === 0) {
      if (typeof m.content === "string" && m.content.length > 0) {
        parts = [{ type: "text" as const, text: m.content }];
      } else {
        continue;
      }
    }
    coerced.push({
      id: m.id,
      role: m.role,
      parts: parts as UIMessage["parts"],
      metadata: m.metadata,
    });
  }

  let list = coerced;
  while (list.length > 0) {
    const last = list[list.length - 1];
    if (last.role !== "assistant") break;
    if (assistantHasVisibleText(last)) break;
    list = list.slice(0, -1);
  }
  return list;
}

/**
 * 从 localStorage 读取已保存的对话消息。
 * 解析失败时返回 null，避免坏数据卡死页面。
 */
export function loadChatMessages(): UIMessage[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const normalized = normalizeStoredChatMessages(parsed);
    return normalized.length > 0 ? normalized : null;
  } catch {
    return null;
  }
}

/** 将当前消息列表写入 localStorage，供刷新后恢复 */
export function saveChatMessages(messages: UIMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // 存储配额满等情况：静默失败，不影响聊天
  }
}

/** 清空本地对话存档 */
export function clearChatStorage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CHAT_STORAGE_KEY);
}
