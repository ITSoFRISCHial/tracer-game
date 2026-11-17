import type { Metadata, Viewport } from 'next';
import { Open_Sans } from 'next/font/google';
import './globals.css';

const openSans = Open_Sans({
  variable: '--font-open-sans',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'] // 800 = chunky button labels and headings,
});

export const metadata: Metadata = {
  title: 'Trace the Word',
  description: 'A fun letter tracing game for kids',
  // iOS PWA settings
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Trace the Word',
  },
  // Prevent phone number detection
  formatDetection: {
    telephone: false,
  },
};

// Viewport settings - prevent zoom on iOS
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

/**
 * Root layout. Loads Open Sans and sets iOS web-app meta tags. The viewport is
 * locked (no pinch zoom) on purpose: this is a drawing game and a stray pinch
 * would shift the canvas. `viewportFit: cover` lets the app use the full screen;
 * page.tsx adds safe-area padding.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* iOS-specific meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${openSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
