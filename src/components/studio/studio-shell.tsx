"use client";

/**
 * 工作台外壳：左侧导航说明 + 中央对话区；文案由 i18n 提供，可中英切换。
 */
import { SocraticChatPanel } from "@/components/studio/socratic-chat-panel";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

export function StudioShell() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="flex h-dvh min-h-0 w-full flex-col bg-background md:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-border bg-sidebar px-4 py-4 md:w-64 md:border-r md:border-b-0 md:py-6">
        <div className="mb-1 font-semibold tracking-tight text-sidebar-foreground">
          {t("sidebarTitle")}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("sidebarSubtitle")}
        </p>
        <div className="mt-4 rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3 text-xs leading-relaxed text-sidebar-accent-foreground">
          <p className="font-medium text-sidebar-foreground">{t("sidebarPhaseTitle")}</p>
          <p className="mt-1 text-muted-foreground">{t("sidebarPhaseBody")}</p>
        </div>

        <div className="mt-4 flex gap-1 rounded-lg border border-sidebar-border bg-sidebar p-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 text-xs",
              locale === "zh" && "bg-background shadow-sm"
            )}
            onClick={() => setLocale("zh")}
          >
            {t("langShortZh")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 text-xs",
              locale === "en" && "bg-background shadow-sm"
            )}
            onClick={() => setLocale("en")}
          >
            {t("langShortEn")}
          </Button>
        </div>

        <p className="mt-auto hidden pt-4 text-[11px] text-muted-foreground md:block">
          {t("sidebarFooter")}
        </p>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <SocraticChatPanel />
      </main>
    </div>
  );
}
