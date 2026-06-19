import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://carolina-atlas.com"),
  title: {
    default: "Carolina Atlas",
    template: "%s | Carolina Atlas",
  },
  description:
    "Transparent civic data for North Carolina communities — crime, education, demographics, and public insight.",
  keywords: [
    "North Carolina",
    "civic data",
    "crime statistics",
    "public transparency",
    "Raleigh",
    "NC open data",
    "community data",
  ],
  openGraph: {
    siteName: "Carolina Atlas",
    title: "Carolina Atlas",
    description:
      "Transparent civic data for North Carolina communities — crime, education, demographics, and public insight.",
    type: "website",
    url: "https://carolina-atlas.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Carolina Atlas",
    description:
      "Transparent civic data for North Carolina communities — crime, education, demographics, and public insight.",
  },
  verification: {
    google: "9VLfVBIWfxOIUFSbWr5wdwKixfbvskgVWyfoD1rixh0",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Load Poppins (headings) and Inter (body) from Google Fonts via <link> 
            so the build doesn't fail in restricted network environments */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F5F7FA] antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
