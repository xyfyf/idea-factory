/**
 * 全站界面文案（中英）。键名保持稳定，便于在组件里用 t("key") 引用。
 */
export type AppLocale = "zh" | "en";

export const LOCALE_STORAGE_KEY = "idea-factory-locale";

export type MessageKey = keyof typeof UI_MESSAGES.zh;

/** 中英对照的 UI 字典 */
export const UI_MESSAGES = {
  zh: {
    docTitle: "想法工场",
    langShortZh: "中文",
    langShortEn: "English",
    sidebarTitle: "想法工场",
    sidebarSubtitle:
      "随口说想法 → 问答理边界 → 出需求文档 → AI 反复写改到能跑（MVP）",
    sidebarPhaseTitle: "当前阶段",
    sidebarPhaseBody:
      "需求澄清：用对话把想法说清楚。产品经理助手会主动反问，不会直接写代码。",
    sidebarFooter: "对话记录保存在本机浏览器，清除站点数据会一并删除。",
    chatTitle: "需求澄清",
    chatSubtitle: "随便描述你的想法，助手会通过反问帮你理清边界。",
    stop: "停止",
    clearChat: "清空对话",
    cardTitle: "从这里开始",
    cardP1:
      "用一两句话说说你想做的东西，例如：「我想做一个帮小餐馆做外卖接单的小程序」。",
    cardP2Prefix: "助手会像你身边的",
    cardP2Strong: "产品经理",
    cardP2Suffix: "一样，每次先问 2～3 个关键问题，再往下聊。",
    cardTech:
      "技术提示：在 .env.local 中配置 DEEPSEEK_API_KEY 或 OPENAI_API_KEY 后需重启开发服务器（可交给开发人员配置）。",
    roleUser: "我",
    roleAssistant: "产品经理助手",
    thinking: "正在思考…",
    errorTitle: "出错了",
    errorFallback: "请求失败。请检查网络，或确认是否已正确配置 API 密钥。",
    closeHint: "关闭提示",
    placeholder:
      "用中文描述你的产品想法…（Shift+Enter 换行；若 Enter 未发送，请点击发送）",
    saveNote: "对话会自动保存在本机浏览器",
    sending: "发送中",
    send: "发送",
    errNotFoundHint:
      "接口返回了「未找到」。常见原因：① 开发服务是旧进程（请关掉所有 npm run dev 后重启）；② 浏览器与接口不在同一站点。可先打开 /api/health 看是否返回 ok。若仍失败，可点「清空对话」排除本地半截消息。",
    errCdnHint:
      "这段报错看起来像访问到了外网 CDN/网关。请确认地址栏是 localhost 或本机 IP+端口，并只运行当前项目这一个开发服务。",
    exportLarkTitle: "导出到飞书：由对话生成 PRD（Markdown）并复制",
    exportNotionTitle: "导出到 Notion：由对话生成 PRD（Markdown）并复制",
    exportPdfTitle: "导出 PDF：由对话生成 PRD 后打开打印页（可选「另存为 PDF」）",
    exportPrdGenerating: "正在根据对话生成 PRD，请稍候…",
    exportPrdFailPrefix: "生成 PRD 失败：",
    exportMdCopied:
      "已复制由模型生成的 PRD（Markdown）。可在飞书、Notion、Google 文档、Confluence 等中粘贴。",
    exportPdfOpened: "已打开新窗口。请在打印对话框中选择「另存为 PDF」。",
    exportEmpty: "还没有对话内容，无法导出。",
    exportCopyFail: "复制失败，请检查浏览器剪贴板权限。",
    exportPopupBlocked: "无法打开窗口，请允许本站弹出窗口后重试。",
    exportMoreLabel: "海外 / 本地",
    exportGoogleTitle: "Google Docs：由对话生成 PRD（Markdown）并复制",
    exportConfluenceTitle: "Confluence：由对话生成 PRD（Markdown）并复制",
    exportDownloadMdTitle: "下载 .md：由对话生成 PRD（Obsidian、VS Code 等）",
    exportMdDownloaded: "已触发下载由模型生成的 .md，请在下载记录中查看。",
  },
  en: {
    docTitle: "Idea Workshop",
    langShortZh: "中文",
    langShortEn: "English",
    sidebarTitle: "Idea Workshop",
    sidebarSubtitle:
      "Say your idea → Q&A to clarify → PRD → AI loops on code until it runs (MVP)",
    sidebarPhaseTitle: "Current phase",
    sidebarPhaseBody:
      "Discovery chat: explain your idea in plain language. The PM assistant asks follow-ups and will not jump straight to code.",
    sidebarFooter:
      "Chats are saved in this browser only. Clearing site data will delete them.",
    chatTitle: "Discovery chat",
    chatSubtitle:
      "Describe your idea freely—the assistant will ask questions to clarify scope.",
    stop: "Stop",
    clearChat: "Clear chat",
    cardTitle: "Start here",
    cardP1:
      'In one or two sentences, say what you want to build—e.g. “A mini-app for small restaurants to take delivery orders.”',
    cardP2Prefix: "The assistant acts like a ",
    cardP2Strong: "product manager",
    cardP2Suffix: " beside you: each turn it asks 2–3 focused questions before moving on.",
    cardTech:
      "For developers: set DEEPSEEK_API_KEY or OPENAI_API_KEY in .env.local, then restart the dev server.",
    roleUser: "Me",
    roleAssistant: "PM assistant",
    thinking: "Thinking…",
    errorTitle: "Something went wrong",
    errorFallback:
      "Request failed. Check your network or confirm the API key is configured.",
    closeHint: "Dismiss",
    placeholder:
      "Describe your product idea… (Shift+Enter for newline; click Send if Enter does not submit)",
    saveNote: "This chat auto-saves in your browser",
    sending: "Sending",
    send: "Send",
    errNotFoundHint:
      'The server returned "Not Found". Often: ① an old dev server is still running (stop all `npm run dev`, restart one); ② page origin does not match the API. Open /api/health — you should see ok: true. If it still fails, click "Clear chat" to remove broken local history.',
    errCdnHint:
      "This error looks like a CDN/gateway response, not your local Next server. Confirm you are on localhost (or your LAN IP + port) and only one dev server for this project is running.",
    exportLarkTitle: "Feishu: generate PRD from chat (Markdown) and copy",
    exportNotionTitle: "Notion: generate PRD from chat (Markdown) and copy",
    exportPdfTitle: "PDF: generate PRD from chat, then open print (Save as PDF)",
    exportPrdGenerating: "Generating PRD from your chat…",
    exportPrdFailPrefix: "PRD generation failed: ",
    exportMdCopied:
      "Model-generated PRD (Markdown) copied. Paste into Feishu, Notion, Google Docs, Confluence, etc.",
    exportPdfOpened: "A new tab opened. In the print dialog, choose Save as PDF.",
    exportEmpty: "Nothing to export yet—start a chat first.",
    exportCopyFail: "Copy failed. Check clipboard permissions in your browser.",
    exportPopupBlocked: "Pop-up blocked. Allow pop-ups for this site and try again.",
    exportMoreLabel: "Global / local",
    exportGoogleTitle: "Google Docs: generate PRD from chat (Markdown) and copy",
    exportConfluenceTitle: "Confluence: generate PRD from chat (Markdown) and copy",
    exportDownloadMdTitle: "Download .md: PRD from chat (Obsidian, VS Code, etc.)",
    exportMdDownloaded: "Model-generated .md download started—check Downloads.",
  },
} as const;
