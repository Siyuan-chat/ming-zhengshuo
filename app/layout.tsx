import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "明正朔",
  description: "东亚历代年号与默认正统线纪年转换工具。",
  applicationName: "明正朔",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png", sizes: "200x200" }],
    shortcut: "/favicon.png",
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "200x200" }],
  },
  openGraph: {
    title: "明正朔",
    description: "辨年号，归正朔。",
    images: [{ url: "/og.png", width: 1792, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "明正朔",
    description: "辨年号，归正朔。",
    images: ["/og.png"],
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
