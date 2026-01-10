import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexProvider } from "@/lib/convex/client";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DH12 Notetaking App",
  description: "Advanced notetaking platform with live transcription and AI explanations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <ConvexProvider>
            {children}
          </ConvexProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
