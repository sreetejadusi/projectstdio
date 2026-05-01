import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Survey | Frogmatrix",
  description: "Customer Discovery Survey",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta property="og:image" content="https://survey.frogmatrix.com/meta.png"></meta>
      </head>
      <body>{children}</body>
    </html>
  );
}
