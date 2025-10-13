import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ludo Turco - Türkiye'nin En İyi Ludo Oyunu",
  description: "Türkiye'nin en sevilen Ludo oyunu! Arkadaşlarınla veya dünyanın dört bir yanından oyuncularla çevrimiçi oyna, turnuvalara katıl, seviye atla ve ödüller kazan.",
  keywords: "ludo, tavla, okey, online oyun, çok oyunculu, mobil oyun, strateji oyunu, türkçe ludo",
  icons: {
    icon: '/header_logo.png',
    apple: '/header_logo.png',
  },
  openGraph: {
    title: "Ludo Turco - Türkiye'nin En İyi Ludo Oyunu",
    description: "Türkiye'nin en sevilen Ludo oyunu! Arkadaşlarınla veya dünyanın dört bir yanından oyuncularla çevrimiçi oyna.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navigation />
        <main className="min-h-screen pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}
