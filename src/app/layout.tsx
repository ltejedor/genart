import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { Metadata } from "next";
import { Toaster } from "react-hot-toast";

import { TRPCReactProvider } from "@/trpc/react";
import { BetaBanner } from "@/components/BetaBanner";

export const metadata: Metadata = {
  title: "Mosaic by Mechifact",
  description: "Create beautiful mosaic art using AI-powered image patch generation and arrangement",
  icons: [
    { rel: "icon", url: "/favicon.ico" }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} bg-gray-50`}>
      <body>
        <BetaBanner />
        <TRPCReactProvider>
          {children}
          <Toaster />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
