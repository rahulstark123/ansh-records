import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ANSH Record - Clients & Analytics Dashboard",
  description: "Enterprise clients tracking, geographical insights, and performance analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col font-sans antialiased text-foreground bg-background">
        {children}
      </body>
    </html>
  );
}
