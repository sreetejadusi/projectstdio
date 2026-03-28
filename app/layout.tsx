import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TelemetryProvider } from "@/components/providers/TelemetryProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetBrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FrogMatrix",
  description: "World's #1 visual learning platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta property="og:image" content="/meta.png" />
      </head>
      <body className={`${inter.variable} ${jetBrains.variable}`}>
        <TelemetryProvider>{children}</TelemetryProvider>
      </body>
    </html>
  );
}
