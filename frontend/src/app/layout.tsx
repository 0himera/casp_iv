import type { Metadata } from 'next';
import { Instrument_Serif, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { QueryProvider } from './providers/QueryProvider';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-sans',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-serif',
  weight: '400',
  style: ['italic', 'normal'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Georgia', 'serif'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
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
      className={`${spaceGrotesk.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="h-screen overflow-hidden bg-background text-foreground">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
