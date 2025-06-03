import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ClientAuthProvider from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wish Generator - Create Beautiful Custom Wishes",
  description:
    "Generate beautiful, personalized wishes for any occasion with our AI-powered wish generator. Perfect for birthdays, anniversaries, farewells, and more.",
  keywords:
    "wish generator, custom wishes, AI wishes, birthday wishes, anniversary wishes, personalized messages",
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
        {/* Umami Analytics */}
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="c75de7a2-7788-4155-bcf0-3d1fba216967"
          strategy="afterInteractive"
        />
        <ClientAuthProvider>{children}</ClientAuthProvider>
      </body>
    </html>
  );
}
