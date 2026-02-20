import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { generateThemeScript } from "@thesandybridge/themes";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/toaster";
import { Footer } from "@/components/footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: {
    default: "{{project_name}}",
    template: "%s | {{project_name}}",
  },
  description: "A sandybridge.io project",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="darkreader-lock" />
        <script dangerouslySetInnerHTML={{ __html: generateThemeScript() }} />
      </head>
      <body className={`${inter.className} ${geistMono.variable} flex min-h-dvh flex-col antialiased`}>
        <QueryProvider>
          <ThemeProvider>
            <Navbar />
            <Toaster />
            <main className="flex flex-1 flex-col">
              {children}
            </main>
            <Footer />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
