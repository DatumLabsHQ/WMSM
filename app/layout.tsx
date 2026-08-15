import type { Metadata, Viewport } from 'next';
import { Source_Serif_4, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './ds.css';

/* The three Datum Labs typefaces, each in the role the brand book gives it.
   Source Serif carries headings — "quiet authority, weight without demanding
   attention". Geist carries body. Geist Mono carries labels, captions and
   eyebrows, which is why the uppercase mono eyebrow is back. */
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-source-serif',
  display: 'swap',
});
const geist = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-geist',
  display: 'swap',
});
const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'West Midlands Startup Map',
    template: '%s · West Midlands Startup Map',
  },
  description:
    'A gallery of startups across Birmingham, Solihull, Coventry, Warwickshire and the Black Country, with the jobs and funding behind them. Checked by a person.',
  openGraph: {
    type: 'website',
    siteName: 'West Midlands Startup Map',
    locale: 'en_GB',
  },
};

export const viewport: Viewport = {
  themeColor: '#F5F7FA',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${sourceSerif.variable} ${geist.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
