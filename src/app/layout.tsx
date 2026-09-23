import type { Metadata } from "next";
import Link from "next/link";
import { Anton, Work_Sans, Space_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import Logo from "@/components/Logo";
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
  metadataBase: new URL("https://www.clubsranked.co.uk"),
  title: {
    default: "Clubs Ranked",
    template: "%s — Clubs Ranked",
  },
  description:
    "Matchmaking and a free XP ladder for EA FC Pro Clubs. Post a challenge, get matched, and climb the ranks.",
  openGraph: {
    title: "Clubs Ranked",
    description:
      "Matchmaking and a free XP ladder for EA FC Pro Clubs. Post a challenge, get matched, and climb the ranks.",
    url: "https://www.clubsranked.co.uk",
    siteName: "Clubs Ranked",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clubs Ranked",
    description:
      "Matchmaking and a free XP ladder for EA FC Pro Clubs. Post a challenge, get matched, and climb the ranks.",
  },
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
          <div className="w-full max-w-5xl mx-auto px-4 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Logo size={20} wordmarkClassName="text-sm" />
              <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <Link href="/about" className="no-underline text-[var(--pcr-muted)] hover:text-[var(--pcr-fg)]">
                  About
                </Link>
                <Link href="/privacy" className="no-underline text-[var(--pcr-muted)] hover:text-[var(--pcr-fg)]">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="no-underline text-[var(--pcr-muted)] hover:text-[var(--pcr-fg)]">
                  Terms of Service
                </Link>
                <a
                  href="mailto:support@clubsranked.co.uk"
                  className="no-underline text-[var(--pcr-muted)] hover:text-[var(--pcr-fg)]"
                >
                  Contact
                </a>
              </nav>
            </div>
            <div className="text-xs font-[family-name:var(--font-mono)] text-[var(--pcr-muted)] flex flex-wrap gap-x-4 gap-y-1 justify-between">
              <span>NO CASH / WAGERING FEATURES — XP LADDER ONLY</span>
              <span className="text-[10px] max-w-xl">
                Clubs Ranked is not affiliated with, endorsed by, or
                sponsored by Electronic Arts Inc. &quot;Pro Clubs&quot; and
                &quot;EA FC&quot; are trademarks of Electronic Arts Inc.
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
