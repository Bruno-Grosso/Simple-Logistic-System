import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-display", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "LogiSys — Logistics & Fleet Operations",
    template: "%s | LogiSys",
  },
  description: "Enterprise logistics platform for fleet routing, warehouse capacity tracking, multi-drop orders, and freight cost analytics.",
  keywords: ["logistics", "fleet management", "supply chain", "warehouse", "tracking", "routing", "freight"],
  authors: [{ name: "LogiSys Logistics Platform" }],
  creator: "LogiSys",
  publisher: "LogiSys",
  applicationName: "LogiSys",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "LogiSys — Logistics & Fleet Operations Platform",
    description: "Enterprise logistics platform for fleet routing, warehouse capacity tracking, multi-drop orders, and freight cost analytics.",
    type: "website",
    locale: "pt_BR",
    siteName: "LogiSys",
  },
  twitter: {
    card: "summary_large_image",
    title: "LogiSys — Logistics & Fleet Operations Platform",
    description: "Enterprise logistics platform for fleet routing, warehouse capacity tracking, multi-drop orders, and freight cost analytics.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={cn(sans.variable, display.variable, mono.variable)}>
      <head>
      </head>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
