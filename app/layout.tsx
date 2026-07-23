import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./companion.css";
import "./commander.css";

export const metadata: Metadata = {
  title: "Always Be Ready",
  description: "Commander und Tablet Companion für League-Duo-Sessions.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/abr-icon.svg" },
};
export const viewport: Viewport = { themeColor: "#0c0e11" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
