import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "Barak Pathways CRM",
  description: "A modern admissions, IELTS, finance, and operations CRM for Barak Pathways."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const storedTheme = localStorage.getItem("barak-theme");
                  const theme = storedTheme === "dark" || storedTheme === "light" ? storedTheme : "light";
                  document.documentElement.classList.toggle("dark", theme === "dark");
                  document.documentElement.dataset.theme = theme;
                  localStorage.setItem("barak-theme", theme);
                } catch {}
              })();
            `
          }}
        />
      </head>
      <body className={inter.variable}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
