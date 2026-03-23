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
  title: "Project Stdio",
  description: "Coding learning platform for learners and institutions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetBrains.variable}`}>
        <TelemetryProvider>{children}</TelemetryProvider>
      </body>
    </html>
  );
}
