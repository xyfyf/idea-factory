/**
 * 根布局：全局字体、HTML lang 与站点元数据（浏览器标签 / SEO 摘要）。
 * 面向非技术用户的产品名以中文「想法工场」为主展示。
 */
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import { LocaleProvider } from "@/components/providers/locale-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "想法工场",
  description:
    "面向非技术创始人：随口说想法，通过对话理清边界，自动生成产品说明文档，并由 AI 循环编写与修正代码直至可运行（MVP）。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <LocaleProvider>{children}</LocaleProvider>
        {/* Vercel 控制台：访客数、页面浏览量等（部署到 Vercel 后自动生效） */}
        <Analytics />
      </body>
    </html>
  );
}
