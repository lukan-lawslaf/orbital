import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "ORBITER | Earth & Space Intelligence", description: "Real-time planetary command center" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
