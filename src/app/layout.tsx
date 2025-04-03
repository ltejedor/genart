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
    <html lang="en" className={`${GeistSans.variable} bg-slate-50`}>
      <body>
        <header className="border-b border-slate-200 bg-white py-4">
          <div className="container mx-auto px-4 flex items-center">
            <div className="flex items-center">
              <img src="/logo.svg" alt="Mosaic by Mechifact" className="h-8 w-8 mr-2" />
              <span className="text-xl font-bold text-blue-600">Mosaic by Mechifact</span>
            </div>
          </div>
        </header>
        <BetaBanner />
        <TRPCReactProvider>
          {children}
          <Toaster />
        </TRPCReactProvider>
      </body>
    </html>
  );
}