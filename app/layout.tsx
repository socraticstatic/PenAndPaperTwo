import type { Metadata } from "next";
import Script from "next/script";
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* Prototype stylesheet — loaded verbatim, the literal port. */}
        <link rel="stylesheet" href="/prototype/styles.css" />
      </head>
      <body>
        {children}

        {/* Custom element <image-slot>. Define before any markup using it
            renders; afterInteractive is fine because the element upgrades
            retroactively once defined. */}
        <Script
          src="/prototype/image-slot.js"
          strategy="afterInteractive"
        />

        {/* React 18 UMD + Babel standalone host the prototype's runtime-JSX
            tweaks panel. They live alongside Next.js's bundled React 19 —
            the panel mounts into its own appended root, no DOM conflict. */}
        <Script
          src="https://unpkg.com/react@18.3.1/umd/react.development.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js"
          strategy="afterInteractive"
        />
        {/* Babel auto-scans for type=text/babel on load — these get
            compiled and executed when Babel finishes initialising. */}
        <script
          src="/prototype/tweaks-panel.jsx"
          type="text/babel"
          defer
        ></script>
        <script src="/prototype/tweaks.jsx" type="text/babel" defer></script>

        <Script src="/prototype/search.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
