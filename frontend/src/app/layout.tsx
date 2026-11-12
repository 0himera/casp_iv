import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Serif } from 'next/font/google';
import { QueryProvider } from './providers/QueryProvider';
import './globals.css';

const plexSans = IBM_Plex_Sans({
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

const plexSerif = IBM_Plex_Serif({
  variable: '--font-serif',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  preload: false,
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-mono',
  weight: ['400', '500', '600'],
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: 'Caspian Transit — маршрутный журнал',
  description:
    'Маршруты, погодные окна и цифровые паспорта грузов Каспийского бассейна',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="ru"
      className={`${plexSans.variable} ${plexSerif.variable} ${ibmPlexMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
