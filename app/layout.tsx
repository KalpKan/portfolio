import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./kalpos.css";
import PostHogProvider from "@/components/PostHogProvider";
import { SITE } from "@/lib/site";
import { APPEARANCE_SCRIPT } from "@/lib/appearance";
import { BOOT_SCRIPT } from "@/lib/boot";

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
  "The desk of Kalp Kansara: live web apps with a measured health signal, browser-ML demos, and hardware and iOS case studies. Type anything to unlock.";

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

// Two scripts run before the first paint (Next guide "preventing flash
// before hydration"), both guarded and both idempotent:
//   lib/appearance.ts — <html data-appearance> and color-scheme from the
//     stored choice, so a dark visitor never sees a white frame (T6.10);
//   lib/boot.ts — a deep link or ?desk gets the desk straight away with no
//     flash of the boot or the lock. A plain visit always boots and locks.
// The React root reads the same attributes after hydration.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${mono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
