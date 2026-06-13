import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dpro ArtsFes System | Premium Festival Management",
  description: "Dpro ArtsFes System is a premium multi-tenant festival management suite by Dpro Technologies. Manage teams, programs, and live standings.",
  keywords: ["dpro artsfes system", "dpro artsfes", "artsfes system", "artsfest system", "dpro artsfest", "festival management software"],
  openGraph: {
    title: "Dpro ArtsFes System",
    description: "Premium Multi-Tenant Festival Management Suite by Dpro Technologies",
    type: "website",
    url: "https://dpro-artsfest.vercel.app/",
    siteName: "Dpro ArtsFes System",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
