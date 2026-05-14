import type { UIMessage } from "ai";
import type { AppLocale } from "@/lib/i18n/messages";

/** 打印页侧栏「目录」等固定文案 */
const PRINT_UI: Record<AppLocale, { toc: string; defaultTitle: string }> = {
  zh: { toc: "目录", defaultTitle: "PRD" },
  en: { toc: "Table of contents", defaultTitle: "PRD" },
};

/**
 * 调用服务端，根据需求澄清对话生成结构化 PRD（Markdown），不是对话逐条拼接。
 */
export async function generatePrdFromChat(
  messages: UIMessage[],
  locale: AppLocale
): Promise<{ ok: true; prd: string } | { ok: false; error: string }> {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const res = await fetch(`${origin}/api/prd/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, locale }),
  });
  let data: { prd?: string; error?: string } = {};
  try {
    data = (await res.json()) as { prd?: string; error?: string };
  } catch {
    return {
      ok: false,
      error: locale === "en" ? "Invalid JSON from server." : "服务端返回非 JSON。",
    };
  }
  if (!res.ok) {
    return {
      ok: false,
      error: data.error ?? (locale === "en" ? `Request failed (${res.status})` : `请求失败（${res.status}）`),
    };
  }
  const prd = data.prd?.trim() ?? "";
  if (!prd) {
    return { ok: false, error: locale === "en" ? "Empty PRD from model." : "模型返回的 PRD 为空。" };
  }
  return { ok: true, prd };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 从正文取一级标题作为浏览器标题；没有则用默认 */
function extractDocumentTitle(md: string, fallback: string): string {
  const m = md.match(/^#\s+(.+)$/m);
  return (m?.[1] ?? fallback).trim();
}

/**
 * 为每个二级标题前插入锚点，并收集目录项（排除 ###，避免误匹配）。
 */
function injectH2AnchorsAndToc(md: string): { md: string; toc: { id: string; title: string }[] } {
  const toc: { id: string; title: string }[] = [];
  let i = 0;
  const md2 = md.replace(/^## (?!#)(.+)$/gm, (_, title: string) => {
    const id = `h2-${i++}`;
    toc.push({ id, title: title.trim() });
    return `<a id="${id}"></a>\n## ${title}`;
  });
  return { md: md2, toc };
}

/**
 * 极简 Markdown → HTML（标题、引用、分隔线、粗体、列表、段落；与锚点+h2 组合块兼容）。
 */
function markdownToSimpleHtml(md: string): string {
  const blocks = md.split(/\n{2,}/);
  const out: string[] = [];
  for (const block of blocks) {
    const b = block.trim();
    if (!b) continue;
    if (b.startsWith("<a id=")) {
      const nl = b.indexOf("\n");
      if (nl !== -1) {
        const anchorLine = b.slice(0, nl);
        const rest = b.slice(nl + 1).trim();
        const idMatch = anchorLine.match(/id="([^"]+)"/);
        const id = idMatch?.[1] ?? "";
        if (rest.startsWith("## ")) {
          out.push(`<h2 id="${escapeHtml(id)}">${inlineMd(escapeHtml(rest.slice(3)))}</h2>`);
          continue;
        }
      }
    }
    if (b.startsWith("# ")) {
      out.push(`<h1>${inlineMd(escapeHtml(b.slice(2)))}</h1>`);
    } else if (b.startsWith("## ")) {
      const raw = b.slice(3);
      out.push(`<h2>${inlineMd(escapeHtml(raw))}</h2>`);
    } else if (b.startsWith("### ")) {
      out.push(`<h3>${inlineMd(escapeHtml(b.slice(4)))}</h3>`);
    } else if (b.startsWith("> ")) {
      const inner = b
        .split("\n")
        .map((l) => l.replace(/^>\s?/, ""))
        .join("\n");
      out.push(`<blockquote>${inlineMd(escapeHtml(inner)).replace(/\n/g, "<br/>")}</blockquote>`);
    } else if (b === "---") {
      out.push("<hr/>");
    } else if (b.startsWith("- ")) {
      const items = b.split("\n").filter((l) => l.startsWith("- "));
      out.push("<ul>" + items.map((l) => `<li>${inlineMd(escapeHtml(l.slice(2)))}</li>`).join("") + "</ul>");
    } else if (b.startsWith("_") && b.endsWith("_") && b.includes("Generated")) {
      out.push(`<p><em>${inlineMd(escapeHtml(b.replace(/^_+|_+$/g, "")))}</em></p>`);
    } else {
      out.push(`<p>${inlineMd(escapeHtml(b)).replace(/\n/g, "<br/>")}</p>`);
    }
  }
  return out.join("\n");
}

/** 在已转义 HTML 内处理 **粗体** */
function inlineMd(escaped: string): string {
  return escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

/**
 * 用已生成的 PRD 正文打开打印页（侧栏目录由 ## 动态生成）。
 * @returns 是否成功打开新窗口
 */
export function openPrintablePrdMarkdown(prdMd: string, locale: AppLocale): boolean {
  const L = PRINT_UI[locale];
  const { md: mdWithAnchors, toc } = injectH2AnchorsAndToc(prdMd);
  const htmlBody = markdownToSimpleHtml(mdWithAnchors);
  const title = extractDocumentTitle(prdMd, L.defaultTitle);

  const navLinks =
    toc.length > 0
      ? toc.map((item) => `<a href="#${escapeHtml(item.id)}">${escapeHtml(item.title)}</a>`).join("")
      : `<span style="font-size:0.875rem;color:#666">${locale === "zh" ? "（无二级标题目录）" : "(No H2 headings)"}</span>`;

  const w = window.open("", "_blank");
  if (!w) return false;

  w.document.write(`<!DOCTYPE html>
<html lang="${locale === "zh" ? "zh-CN" : "en"}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, "Segoe UI", Roboto, "PingFang SC", sans-serif; color: #111; background: #fafafa; }
    .layout { display: flex; min-height: 100vh; }
    nav {
      width: 220px; flex-shrink: 0; padding: 1.25rem 1rem; background: #fff; border-right: 1px solid #e5e5e5;
      position: sticky; top: 0; align-self: flex-start; max-height: 100vh; overflow: auto;
    }
    nav h2 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: #666; margin: 0 0 0.75rem; }
    nav a { display: block; font-size: 0.875rem; color: #2563eb; text-decoration: none; margin: 0.35rem 0; }
    nav a:hover { text-decoration: underline; }
    main { flex: 1; padding: 1.5rem 2rem; max-width: 52rem; }
    main :where(h1,h2,h3) { scroll-margin-top: 1rem; }
    h1 { font-size: 1.5rem; margin-top: 0; }
    h2 { font-size: 1.15rem; margin-top: 1.75rem; border-bottom: 1px solid #eee; padding-bottom: 0.25rem; }
    h3 { font-size: 1rem; margin-top: 1.25rem; color: #444; }
    p, li { line-height: 1.65; font-size: 0.95rem; }
    pre { white-space: pre-wrap; word-break: break-word; background: #fff; border: 1px solid #eee; padding: 0.75rem; border-radius: 6px; font-size: 0.85rem; }
    blockquote { margin: 0.5rem 0; padding-left: 0.75rem; border-left: 3px solid #ccc; color: #555; }
    hr { border: none; border-top: 1px solid #e5e5e5; margin: 1.5rem 0; }
    @media print {
      nav { display: none; }
      main { max-width: none; padding: 0; }
      body { background: #fff; }
    }
  </style>
</head>
<body>
  <div class="layout">
    <nav>
      <h2>${escapeHtml(L.toc)}</h2>
      ${navLinks}
    </nav>
    <main>${htmlBody}</main>
  </div>
</body>
</html>`);
  w.document.close();
  w.focus();
  requestAnimationFrame(() => {
    w.print();
  });
  return true;
}

/** 先请求生成 PRD，再打开打印页 */
export async function openPrintablePrd(
  messages: UIMessage[],
  locale: AppLocale
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gen = await generatePrdFromChat(messages, locale);
  if (!gen.ok) return gen;
  const opened = openPrintablePrdMarkdown(gen.prd, locale);
  return opened ? { ok: true } : { ok: false, error: locale === "en" ? "Pop-up blocked." : "无法打开新窗口。" };
}

/** 生成 PRD 后复制 Markdown 到剪贴板 */
export async function copyPrdMarkdown(
  messages: UIMessage[],
  locale: AppLocale
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gen = await generatePrdFromChat(messages, locale);
  if (!gen.ok) return gen;
  try {
    await navigator.clipboard.writeText(gen.prd);
    return { ok: true };
  } catch {
    return { ok: false, error: locale === "en" ? "Clipboard denied." : "剪贴板权限被拒绝。" };
  }
}

/** 生成 PRD 后下载 .md */
export async function downloadPrdMarkdownFile(
  messages: UIMessage[],
  locale: AppLocale
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gen = await generatePrdFromChat(messages, locale);
  if (!gen.ok) return gen;
  const blob = new Blob([gen.prd], { type: "text/markdown;charset=utf-8" });
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = URL.createObjectURL(blob);
  a.download = `PRD-${locale}-${stamp}.md`;
  a.click();
  URL.revokeObjectURL(a.href);
  return { ok: true };
}
