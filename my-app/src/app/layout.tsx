import type { Metadata, Viewport } from "next";
import { Caveat, Fraunces, Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-bd-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const caveat = Caveat({
  variable: "--font-bd-script",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const APP_URL = "https://bluedate.io";
const TITLE = "bluedate — campus dating, thoughtfully done";
const DESCRIPTION =
  "Exclusive weekly matches for college students. Opt in every week, get matched with someone from your campus based on what matters most.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: TITLE,
    template: "%s · bluedate",
  },
  description: DESCRIPTION,
  keywords: [
    "campus dating",
    "college dating app",
    "student dating India",
    "weekly match",
    "bluedate",
    "VIT AP dating",
    "KL University dating",
    "SRM AP dating",
  ],
  authors: [{ name: "bluedate", url: APP_URL }],
  creator: "bluedate",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: APP_URL,
    siteName: "bluedate",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "bluedate — campus dating, thoughtfully done",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
    creator: "@bluedateio",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "bluedate",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#FEFCF0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${fraunces.variable} ${caveat.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
