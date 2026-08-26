import type { Metadata } from "next";
import { Anton, Work_Sans, Space_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import "./globals.css";

const anton = Anton({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const workSans = Work_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Pro Clubs Ranked",
  description: "Matchmaking and XP ladder for EA FC Pro Clubs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${workSans.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--pcr-bg)] text-[var(--pcr-fg)] font-[family-name:var(--font-body)]">
        <NavBar />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-[var(--pcr-border)] py-6 mt-auto">
          <div className="w-full max-w-5xl mx-auto px-4 text-xs font-[family-name:var(--font-mono)] text-[var(--pcr-muted)] flex flex-wrap gap-x-4 gap-y-1 justify-between">
            <span>PRO CLUBS RANKED — MVP BUILD</span>
            <span>NO CASH / WAGERING FEATURES — XP LADDER ONLY</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
