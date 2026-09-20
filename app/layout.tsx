import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./kalpos.css";
import PostHogProvider from "@/components/PostHogProvider";
import { SITE } from "@/lib/site";
import { VISITED_KEY } from "@/lib/visitor";

// KalpOS chrome uses the system sans (-apple-system / SF Pro), as the mock
// does; Geist Mono is the one self-hosted web font, used where card 1e uses
// it (the phone top bar and sheet meta) and in the Terminal window. Weight
// 400 only; the latin subset from Google Fonts (OFL), kept in app/fonts.
const mono = localFont({
  src: "./fonts/GeistMono-400-latin.woff2",
  variable: "--font-mono",
  weight: "400",
  style: "normal",
  display: "swap",
  adjustFontFallback: false,
});

const TITLE = "Kalp Kansara — KalpOS";
const DESCRIPTION =
  "A desk of every project Kalp Kansara has shipped: live web apps with a measured health signal, browser-ML demos, and hardware and iOS case studies. Type anything to unlock.";

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
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Runs before the first paint: a returning visitor (lib/visitor.ts) gets the
// desk straight away with no flash of the lock screen. The React root reads
// the same attribute after hydration (Next guide "preventing flash before
// hydration").
const BOOT_SCRIPT = `(function(){try{if(localStorage.getItem(${JSON.stringify(VISITED_KEY)})==="1")document.documentElement.setAttribute("data-kos-boot","desk")}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${mono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
