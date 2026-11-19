import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ufficio Agenti",
  description: "L'ufficio privato dove gli agenti IA lavorano nelle stanze.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className="antialiased">{children}</body>
    </html>
  );
}
