import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "CoinRichAI - AI Powered Cryptocurrency Insights",
  description: "AI-driven cryptocurrency news aggregation, market data, and intelligent analysis. Real-time crypto prices, AI commentary, and Fear & Greed Index.",
  keywords: ["cryptocurrency", "AI", "crypto news", "bitcoin", "ethereum", "market data", "fear greed index"],
  authors: [{ name: "CoinRichAI" }],
  icons: {
    icon: "/coinrichai-logo.png",
  },
  openGraph: {
    title: "CoinRichAI - AI Powered Cryptocurrency Insights",
    description: "AI-driven cryptocurrency news aggregation and market intelligence",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
