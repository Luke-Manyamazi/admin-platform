/**
 * ADMIN Typography Tokens
 *
 * Font family names and CSS variable names.
 * Actual font loading happens in apps/web via next/font/google — the app
 * sets these CSS variables on the <html> element so the Tailwind preset
 * can reference them via var(--font-*).
 *
 * In your Next.js root layout:
 *
 *   import { Bebas_Neue, Syne, JetBrains_Mono } from 'next/font/google';
 *
 *   const bebasNeue = Bebas_Neue({
 *     weight: '400',
 *     subsets: ['latin'],
 *     variable: '--font-display',
 *     display: 'swap',
 *   });
 *
 *   const syne = Syne({
 *     subsets: ['latin'],
 *     variable: '--font-body',
 *     display: 'swap',
 *   });
 *
 *   const jetBrainsMono = JetBrains_Mono({
 *     subsets: ['latin'],
 *     variable: '--font-mono',
 *     display: 'swap',
 *   });
 *
 *   export default function RootLayout({ children }) {
 *     return (
 *       <html className={`${bebasNeue.variable} ${syne.variable} ${jetBrainsMono.variable}`}>
 *         ...
 *       </html>
 *     );
 *   }
 */

export const FontVariables = {
  display: '--font-display',
  body: '--font-body',
  mono: '--font-mono',
} as const;

export const FontFamilies = {
  /** Bebas Neue — display headings, hero text, section labels */
  display: 'Bebas Neue',
  /** Syne — body text, UI labels, navigation */
  body: 'Syne',
  /** JetBrains Mono — code, order numbers, numeric data, IDs */
  mono: 'JetBrains Mono',
} as const;
