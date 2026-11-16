import "./globals.css";
import type { Metadata } from "next";
import { Sidebar } from "@/components/console/sidebar";

export const metadata: Metadata = {
  title: { default: "Overview | Orivyn", template: "%s | Orivyn" },
  description: "Orivyn console for browser and server-side intelligence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen lg:flex">
          <Sidebar />
          <div className="min-w-0 flex-1">
            <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-5 text-xs text-slate-500 md:px-10">
              <span>ORIVYN / CONTROL PLANE</span>
              <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-[#9c9ffa]" /> Foundation preview</span>
            </div>
            <main className="mx-auto w-full max-w-[1380px] px-5 pb-16 pt-9 md:px-10 md:pt-11">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
