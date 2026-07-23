import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HEIMERS CC GPT – MacroBoard",
  description: "Lokales League-of-Legends-Makro-Dashboard für Nautilus und Heimerdinger.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
