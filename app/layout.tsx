import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import PostHogProvider from "@/components/PostHogProvider";
import { SITE } from "@/lib/site";

// Weight 400 only (DESIGN.md: no weights above 400). The files are Google
// Fonts' own latin subsets (OFL), fetched once with `wght@400` and kept in
// app/fonts, because next/font/google cannot pin a weight while keeping the
// opsz/wdth axes and would ship the whole 200-800 range (131 KB vs 77 KB).
// The bio paragraph's LCP waits on this file, so its size matters.
const grotesk = localFont({
  src: "./fonts/BricolageGrotesque-400-opsz-wdth-latin.woff2",
  variable: "--font-grotesk",
  weight: "400",
  style: "normal",
  display: "swap",
  adjustFontFallback: "Arial",
});

const mono = localFont({
  src: "./fonts/GeistMono-400-latin.woff2",
  variable: "--font-mono",
  weight: "400",
  style: "normal",
  display: "swap",
  adjustFontFallback: false,
});

const TITLE = "Kalp Kansara — projects";
const DESCRIPTION =
  "Every project Kalp Kansara has shipped, on one sheet: live web apps, browser-ML demos, and hardware and iOS case studies.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE.name,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1f3f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1014" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${grotesk.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
