import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
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
  title: {
    template: "%s | Dpro ArtsFes",
    default: "Dpro ArtsFes | Premium Festival Management",
  },
  description: "Dpro ArtsFes is a premium multi-tenant festival management suite by Dpro Technologies. Manage teams, programs, and live standings.",
  applicationName: "Dpro ArtsFes",
  keywords: [
    "dpro",
    "dpro technologies",
    "dpro artsfest system", 
    "dpro artsfest", 
    "artsfest system", 
    "artsfest management system",
    "arts fest system",
    "festival management software"
  ],
  openGraph: {
    title: {
      template: "%s | Dpro ArtsFes",
      default: "Dpro ArtsFes",
    },
    description: "Premium Multi-Tenant Festival Management Suite by Dpro Technologies",
    type: "website",
    url: "https://dpro-artsfest.vercel.app/",
    siteName: "Dpro ArtsFes",
  },
  appleWebApp: {
    title: "Dpro ArtsFes",
    statusBarStyle: "default",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Dpro ArtsFes",
    "url": "https://dpro-artsfest.vercel.app/"
  };

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
