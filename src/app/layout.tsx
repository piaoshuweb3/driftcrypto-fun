import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL =
  process.env.DRIFTCRYPTO_SITE_URL ??
  process.env.DRIFTCRYPTO_API_BASE ??
  "https://driftcrypto-fun.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "driftcrypto - AI Powered Cryptocurrency Insights",
  description:
    "AI-driven cryptocurrency news aggregation, market data, and intelligent analysis. Real-time crypto prices, AI commentary, and Fear & Greed Index.",
  keywords: [
    "cryptocurrency",
    "AI",
    "crypto news",
    "bitcoin",
    "ethereum",
    "market data",
    "fear greed index",
  ],
  authors: [{ name: "driftcrypto" }],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/driftcrypto-logo.svg",
  },
  openGraph: {
    title: "driftcrypto - AI Powered Cryptocurrency Insights",
    description:
      "AI-driven cryptocurrency news aggregation and market intelligence",
    type: "website",
    url: SITE_URL,
    siteName: "driftcrypto",
  },
  twitter: {
    card: "summary_large_image",
    title: "driftcrypto - AI Powered Cryptocurrency Insights",
    description:
      "AI-driven cryptocurrency news aggregation and market intelligence",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the locale on the server so the first render is already in the right
  // language — previously the locale lived in localStorage (server-invisible)
  // and the whole page had to wait for the client to mount before rendering.
  const cookieStore = await cookies();
  const stored = cookieStore.get("driftcrypto-locale")?.value;
  const locale = stored === "zh" || stored === "en" ? stored : "en";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "driftcrypto",
    alternateName: "driftcrypto.fun",
    url: SITE_URL,
    description:
      "AI-powered cryptocurrency intelligence: live prices, AI market commentary, news aggregation and the PiaoShu daily report.",
    inLanguage: ["en", "zh-CN"],
  };

  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"} className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {/* Structured data lets search engines understand the site without
            executing any JavaScript. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers initialLocale={locale}>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
