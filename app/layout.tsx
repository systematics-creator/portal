import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SSO Portal",
  description: "Centralized Identity Provider",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 flex flex-col">
        {children}
      </body>
    </html>
  );
}
