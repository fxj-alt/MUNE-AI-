import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 穿搭 Demo",
  description: "一个用于作品集演示的 AI 衣橱穿搭 Web Demo。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
