import type { Metadata } from "next";
import { Outfit, Inter, Fraunces, JetBrains_Mono, Anek_Malayalam } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const anekMalayalam = Anek_Malayalam({
  variable: "--font-anek",
  subsets: ["malayalam", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-numbers",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Dpro ArtsFes",
    default: "Dpro ArtsFes | Premium Festival Management",
  },
  description:
    "Dpro ArtsFes is a premium multi-tenant festival management suite by Dpro Technologies. Manage teams, programs, and live standings.",
  applicationName: "Dpro ArtsFes",
  colorScheme: "light",
  keywords: [
    "dpro",
    "dpro technologies",
    "dpro artsfest system",
    "dpro artsfest",
    "artsfest system",
    "artsfest management system",
    "arts fest system",
    "festival management software",
  ],
  openGraph: {
    title: {
      template: "%s | Dpro ArtsFes",
      default: "Dpro ArtsFes",
    },
    description:
      "Premium Multi-Tenant Festival Management Suite by Dpro Technologies",
    type: "website",
    url: "https://dpro-artsfest.vercel.app/",
    siteName: "Dpro ArtsFes",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "Dpro ArtsFes Logo",
      },
    ],
  },
  appleWebApp: {
    title: "Dpro ArtsFes",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Dpro ArtsFes",
    url: "https://dpro-artsfest.vercel.app/",
  };

  return (
    <html
      lang="en"
      className={`${outfit.variable} ${anekMalayalam.variable} ${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} font-outfit`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
