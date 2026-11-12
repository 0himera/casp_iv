import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google';
import { QueryProvider } from './providers/QueryProvider';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  variable: '--font-serif',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Smart Caspian Transit — Spectral Cartography & Digital Twin',
  description:
    'Спектральная картография и предиктивный цифровой двойник МТК Север-Юг с паспортом в Casper Testnet',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable} dark antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
