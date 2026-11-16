import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orivyn Playground",
  description: "Explore typed tool proposals and execution boundaries.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
