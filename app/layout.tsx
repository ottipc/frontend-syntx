import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SYNTX - Resonance System",
  description: "SYNTX isn't AI. It's the resonance that governs it.",
  icons: {
    icon: "/Logo1.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
