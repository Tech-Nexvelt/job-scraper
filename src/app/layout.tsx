import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ProfileProvider } from "@/context/profile-context";
import { JobsProvider } from "@/context/jobs-context";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Job Tracker - Premium Dashboard",
  description: "Track your job applications with style",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <JobsProvider>
            <ProfileProvider>
              <div className="flex h-screen overflow-hidden bg-background">
                <Sidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                  <Suspense>
                    <Navbar />
                  </Suspense>
                  <main className="flex-1 overflow-y-auto p-6">
                    {children}
                  </main>
                </div>
              </div>
            </ProfileProvider>
          </JobsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
