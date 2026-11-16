import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orivyn · Independent Consumer",
  description: "Standalone example of Orivyn public React and runtime packages.",
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
