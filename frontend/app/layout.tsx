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
  title: "EduLearn",
  description: "Education Platform",
};

import { Toaster } from "react-hot-toast";

/**
 * The `ToastProvider` function returns a `Toaster` component in a TypeScript React application.
 */
const ToastProvider = () => {
  return <Toaster />;
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
        style={{ fontFamily: "'Geist Sans', sans-serif" }}
      >
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
