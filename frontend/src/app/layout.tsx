import type { Metadata } from 'next';
import { Cormorant_Garamond, IBM_Plex_Mono, Manrope } from 'next/font/google';
import { QueryProvider } from './providers/QueryProvider';
import './globals.css';

const manrope = Manrope({
  variable: '--font-sans',
  subsets: ['latin', 'cyrillic'],
});

const cormorant = Cormorant_Garamond({
  variable: '--font-serif',
  weight: ['400', '500'],
  style: ['italic', 'normal'],
  subsets: ['latin', 'cyrillic'],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-mono',
  weight: ['400', '500'],
  subsets: ['latin', 'cyrillic'],
});

export const metadata: Metadata = {
  title: 'Smart Caspian Transit — Цифровой двойник МТК Север-Юг',
  description:
    'Предиктивный цифровой двойник мультимодального транспортного коридора Север-Юг в Каспийском регионе',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="ru"
      className={`${manrope.variable} ${cormorant.variable} ${ibmPlexMono.variable} dark h-full antialiased`}
    >
      <body className="h-screen overflow-hidden bg-background text-foreground">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
