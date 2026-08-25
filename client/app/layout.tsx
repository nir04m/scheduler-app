import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  DM_Mono,
  Inter,
} from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";
import SiteHeader from "@/components/scheduler/site-header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "Scheduler",
  description: "Find a time that works for everyone.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${bricolage.variable} ${dmMono.variable}`}>
        <div className="min-h-screen bg-background">
          <SiteHeader />
          {children}
        </div>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
