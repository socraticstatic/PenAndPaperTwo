import type { Metadata } from "next";
import { PrototypeRuntime } from "@/components/PrototypeRuntime";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pen & Paper — A Pairing Almanac",
  description:
    "An editorial pairing almanac for fountain pens and the papers they were made for.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* Prototype stylesheet — loaded verbatim, the literal port. */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/prototype/styles.css" />
        {/* image-slot.js only defines a custom element; existing
            <image-slot> tags upgrade retroactively. Loading it in head is
            safe and avoids a flash of unstyled placeholders. */}
        <script src="/prototype/image-slot.js" async={false}></script>
      </head>
      <body suppressHydrationWarning>
        {children}
        {/* All scripts that mutate the prototype DOM run AFTER hydration. */}
        <PrototypeRuntime />
      </body>
    </html>
  );
}
