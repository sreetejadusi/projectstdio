import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { TelemetryProvider } from "@/components/providers/TelemetryProvider";
import { TopNav } from "@/components/layout/TopNav";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetBrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Project Stdio",
  description: "Instructor/student coding workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${jetBrains.variable}`}>
        <TelemetryProvider>
          <TopNav />
          {children}
        </TelemetryProvider>
      </body>
    </html>
  );
}
