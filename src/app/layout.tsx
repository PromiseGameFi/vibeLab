import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VibeLab | The Pro AI Blueprint Manual",
  description: "Stop prompting. Start stacking. Professional AI blueprints, annotated prompts, and tool chains for Cursor, Midjourney, Kling, and more.",
  keywords: ["AI Manual", "AI Stack", "Pro Prompts", "Midjourney Guide", "Kling Workflows", "Vibe Coding"],
  openGraph: {
    title: "VibeLab | The Pro AI Blueprint Manual",
    description: "Master the AI Stack with professional, annotated blueprints.",
    type: "website",
    url: "https://vibelab.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "VibeLab | The Pro AI Blueprint Manual",
    description: "Stop prompting. Start stacking. Pro AI blueprints for everyone.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white selection:bg-accent-primary/30 min-h-screen relative`}
      >
        <AuthProvider>
          {/* Background Glows */}
          <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-primary/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-secondary/10 blur-[120px] rounded-full"></div>
          </div>

          <Navbar />
          <main className="pt-24 min-h-screen">
            {children}
          </main>

          <footer className="py-12 px-6 text-center text-white/30 text-sm border-t border-white/5">
            <p>© {new Date().getFullYear()} VibeLab. Built for the AI era.</p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
