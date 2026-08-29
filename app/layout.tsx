import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://ming-zhengshuo.yesiyuansysu.chatgpt.site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "明正朔｜年号转换与正统纪年工具",
  description:
    "明正朔是东亚历史年号转换与正朔纪年工具，完整支持日本自大化至令和的 248 个公年号，并收录隋唐五代、清、朝鲜与大韩帝国等历史纪年。",
  applicationName: "明正朔",
  keywords: [
    "明正朔",
    "年号转换",
    "正朔纪年",
    "东亚纪年",
    "日本古代年号",
    "隋唐五代",
    "后唐",
    "南唐",
    "历史纪年换算",
    "南明",
    "永历",
    "五胡十六国",
    "两晋南北朝",
    "辽金元",
    "民国纪年",
  ],
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png", sizes: "200x200" }],
    shortcut: "/favicon.png",
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "200x200" }],
  },
  openGraph: {
    title: "明正朔｜年号转换与正统纪年工具",
    description: "年号转换、正朔纪年与东亚历史纪年换算工具。",
    url: siteUrl,
    siteName: "明正朔",
    locale: "zh_CN",
    type: "website",
    images: [{ url: "/og.png", width: 1792, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "明正朔｜年号转换与正统纪年工具",
    description: "年号转换、正朔纪年与东亚历史纪年换算工具。",
    images: ["/og.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "明正朔",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  url: siteUrl,
  image: `${siteUrl}/og.png`,
  description:
    "东亚历史年号转换与默认正统线纪年工具，完整支持日本自大化至令和的 248 个公年号。",
  inLanguage: "zh-CN",
  keywords: "年号转换, 正朔纪年, 日本古代年号, 隋唐五代, 后唐, 南唐, 南明, 两晋南北朝",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  publisher: {
    "@type": "Organization",
    name: "明正朔",
    url: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
