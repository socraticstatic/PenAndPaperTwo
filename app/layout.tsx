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
        {/* Supabase config for the prototype's search.js (and any other
            inline-loaded prototype script that needs to talk to the DB).
            Plain JSON values inlined at SSR time — the publishable key is
            already public per Supabase's anon-key model. */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `window.ppSupabaseConfig=${JSON.stringify({
              url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
              anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
            })};`,
          }}
        />
        {children}
        {/* All scripts that mutate the prototype DOM run AFTER hydration. */}
        <PrototypeRuntime />
      </body>
    </html>
  );
}
