import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "毕业去向｜蓝山工作室",
  description: "蓝山工作室成员毕业去向与城市分布。",
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
