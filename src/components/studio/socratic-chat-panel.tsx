"use client";

/**
 * 苏格拉底式需求澄清对话区：对接 /api/chat，持久化 localStorage；语言随全局 Locale 切换。
 * 滚动策略：仅在用户点击发送后滚到底部，避免 AI 流式输出时反复把页面拽到最下端。
 */
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  Blocks,
  CloudUpload,
  FileDown,
  FileText,
  HardDriveDownload,
  Loader2,
  NotebookPen,
  SendHorizontal,
  Square,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  clearChatStorage,
  loadChatMessages,
  saveChatMessages,
} from "@/lib/chat-local-storage";
import type { MessageKey } from "@/lib/i18n/messages";
import { copyPrdMarkdown, downloadPrdMarkdownFile, openPrintablePrd } from "@/lib/prd-export";

/** 从一条 UI 消息里拼接出可见纯文本（当前 MVP 只展示文本部件） */
function messageText(m: UIMessage): string {
  if (!m.parts?.length) return "";
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

/** 根据错误正文匹配补充说明（使用当前语言的文案） */
function chatErrorExtraHint(
  message: string,
  t: (key: MessageKey) => string
): string | null {
  const x = message.trim();
  if (x === "Not Found") return t("errNotFoundHint");
  if (x.includes("cloudfront") || x.includes("statusCode")) return t("errCdnHint");
  return null;
}

export function SocraticChatPanel() {
  const { locale, t } = useLocale();
  const [input, setInput] = useState("");
  const [hasRestored, setHasRestored] = useState(false);
  /** 底部轻提示（导出结果等） */
  const [toast, setToast] = useState<string | null>(null);
  /** 正在调用 /api/prd/generate，避免重复点击与与发送冲突 */
  const [exportingPrd, setExportingPrd] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  /** 仅在用户提交表单后置 true，触发一次滚动到底部 */
  const scrollAfterUserSend = useRef(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: "/api/chat",
        prepareSendMessagesRequest: (opts) => ({
          api:
            typeof window !== "undefined"
              ? `${window.location.origin}/api/chat`
              : opts.api,
          body: {
            ...opts.body,
            id: opts.id,
            messages: opts.messages,
            trigger: opts.trigger,
            messageId: opts.messageId,
            locale,
          },
        }),
      }),
    [locale]
  );

  const { messages, sendMessage, status, stop, setMessages, error, clearError } =
    useChat<UIMessage>({
      transport,
      messages: [],
    });

  useEffect(() => {
    const saved = loadChatMessages();
    if (saved?.length) {
      setMessages(saved);
    }
    setHasRestored(true);
  }, [setMessages]);

  useEffect(() => {
    if (!hasRestored) return;
    saveChatMessages(messages);
  }, [messages, hasRestored]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(id);
  }, [toast]);

  /** 用户发送后才滚到底；流式更新 messages 不会反复触发滚动 */
  useEffect(() => {
    if (!scrollAfterUserSend.current) return;
    scrollAfterUserSend.current = false;
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [messages]);

  const busy = status === "submitted" || status === "streaming";
  const errorDetailHint = error ? chatErrorExtraHint(error.message, t) : null;
  const canExport = messages.length > 0;
  const exportDisabled = busy || exportingPrd || !hasRestored;

  async function handleExportCopy() {
    if (!canExport) {
      setToast(t("exportEmpty"));
      return;
    }
    setExportingPrd(true);
    setToast(t("exportPrdGenerating"));
    const r = await copyPrdMarkdown(messages, locale);
    setExportingPrd(false);
    if (r.ok) setToast(t("exportMdCopied"));
    else if (r.error.includes("Clipboard") || r.error.includes("剪贴板")) setToast(t("exportCopyFail"));
    else setToast(`${t("exportPrdFailPrefix")}${r.error}`);
  }

  async function handleExportPdf() {
    if (!canExport) {
      setToast(t("exportEmpty"));
      return;
    }
    setExportingPrd(true);
    setToast(t("exportPrdGenerating"));
    const r = await openPrintablePrd(messages, locale);
    setExportingPrd(false);
    if (r.ok) setToast(t("exportPdfOpened"));
    else if (r.error.includes("Pop-up") || r.error.includes("窗口")) setToast(t("exportPopupBlocked"));
    else setToast(`${t("exportPrdFailPrefix")}${r.error}`);
  }

  async function handleExportDownloadMd() {
    if (!canExport) {
      setToast(t("exportEmpty"));
      return;
    }
    setExportingPrd(true);
    setToast(t("exportPrdGenerating"));
    const r = await downloadPrdMarkdownFile(messages, locale);
    setExportingPrd(false);
    if (r.ok) setToast(t("exportMdDownloaded"));
    else setToast(`${t("exportPrdFailPrefix")}${r.error}`);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold text-foreground">{t("chatTitle")}</h1>
          <p className="text-xs text-muted-foreground">{t("chatSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          {busy && (
            <Button type="button" variant="outline" size="sm" onClick={() => stop()}>
              <Square className="size-3.5" data-icon="inline-start" />
              {t("stop")}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => {
              clearChatStorage();
              setMessages([]);
              clearError?.();
              setInput("");
            }}
          >
            <Trash2 className="size-3.5" data-icon="inline-start" />
            {t("clearChat")}
          </Button>
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
          {messages.length === 0 && (
            <Card className="border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("cardTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{t("cardP1")}</p>
                <p>
                  {t("cardP2Prefix")}
                  <strong className="text-foreground">{t("cardP2Strong")}</strong>
                  {t("cardP2Suffix")}
                </p>
                <p className="text-xs">{t("cardTech")}</p>
              </CardContent>
            </Card>
          )}

          {messages.map((m) => {
            const text = messageText(m);
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[min(100%,36rem)] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <div className="mb-1 text-[10px] font-medium uppercase opacity-70">
                    {isUser ? t("roleUser") : t("roleAssistant")}
                  </div>
                  <div className="whitespace-pre-wrap">{text}</div>
                </div>
              </div>
            );
          })}

          {status === "submitted" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              {t("thinking")}
            </div>
          )}

          {error && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="space-y-2 py-3 text-sm">
                <p className="font-medium text-destructive">{t("errorTitle")}</p>
                <p className="text-muted-foreground">
                  {error.message || t("errorFallback")}
                </p>
                {errorDetailHint && (
                  <p className="text-xs leading-relaxed text-muted-foreground">{errorDetailHint}</p>
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => clearError?.()}>
                  {t("closeHint")}
                </Button>
              </CardContent>
            </Card>
          )}

          <div ref={endRef} />
        </div>
      </ScrollArea>

      <Separator />

      <form
        className="relative shrink-0 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const text = input.trim();
          if (!text || busy) return;
          clearError?.();
          scrollAfterUserSend.current = true;
          void sendMessage({ text });
          setInput("");
        }}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!hasRestored || busy}
            placeholder={t("placeholder")}
            rows={3}
            className="min-h-[5.5rem] resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span className="min-w-0 flex-1">{t("saveNote")}</span>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={exportDisabled}
                title={t("exportLarkTitle")}
                aria-label={t("exportLarkTitle")}
                onClick={() => void handleExportCopy()}
              >
                {exportingPrd ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CloudUpload className="size-3.5" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={exportDisabled}
                title={t("exportNotionTitle")}
                aria-label={t("exportNotionTitle")}
                onClick={() => void handleExportCopy()}
              >
                {exportingPrd ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <NotebookPen className="size-3.5" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={exportDisabled}
                title={t("exportPdfTitle")}
                aria-label={t("exportPdfTitle")}
                onClick={() => void handleExportPdf()}
              >
                {exportingPrd ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <FileDown className="size-3.5" />
                )}
              </Button>
              <Button type="submit" disabled={!hasRestored || busy || !input.trim()}>
                {busy ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" data-icon="inline-start" />
                    {t("sending")}
                  </>
                ) : (
                  <>
                    <SendHorizontal className="size-3.5" data-icon="inline-start" />
                    {t("send")}
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-border/70 pt-2">
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {t("exportMoreLabel")}
            </span>
            <div className="flex flex-1 flex-wrap justify-end gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={exportDisabled}
                title={t("exportGoogleTitle")}
                aria-label={t("exportGoogleTitle")}
                onClick={() => void handleExportCopy()}
              >
                {exportingPrd ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <FileText className="size-3.5" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={exportDisabled}
                title={t("exportConfluenceTitle")}
                aria-label={t("exportConfluenceTitle")}
                onClick={() => void handleExportCopy()}
              >
                {exportingPrd ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Blocks className="size-3.5" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={exportDisabled}
                title={t("exportDownloadMdTitle")}
                aria-label={t("exportDownloadMdTitle")}
                onClick={() => void handleExportDownloadMd()}
              >
                {exportingPrd ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <HardDriveDownload className="size-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>
        {toast && (
          <div
            role="status"
            className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 max-w-[min(100%,24rem)] -translate-x-1/2 rounded-md border border-border bg-popover px-3 py-2 text-center text-xs text-popover-foreground shadow-md"
          >
            {toast}
          </div>
        )}
      </form>
    </div>
  );
}
