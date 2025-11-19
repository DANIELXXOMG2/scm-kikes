import { Inter, Roboto_Mono } from 'next/font/google';

import './globals.css';

import type { Metadata } from 'next';

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SCM Huevos Kikes",
  description: "Sistema de Gestión de Cadena de Suministro - Huevos Kikes Villavicencio",
  icons: [
    { rel: 'icon', url: '/assets/logos/LOGO-KIKES.avif' },
    { rel: 'apple-touch-icon', url: '/assets/logos/LOGO-KIKES.avif' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="light" style={{ colorScheme: 'light' }}>
      <head>
        <meta name="color-scheme" content="light only" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-base text-text-dark`}
      >
        {children}
      </body>
    </html>
  );
}
