import "./globals.css";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import AppShell from "@/components/shell/AppShell";

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata = {
  title: "Disclose",
  description: "Local-first AI usage disclosures with optional OpenTimestamps proof."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} bg-bg text-fg`}>
        <Script src="/vendor/opentimestamps.min.js" strategy="afterInteractive" />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
