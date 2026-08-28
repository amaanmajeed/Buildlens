import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { Providers } from "@/components/layout/Providers";
import { ThemeSync } from "@/components/ThemeSync";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "BuildLens AI",
  description:
    "Construction specification reader, plan takeoff, and estimate draft demo.",
  icons: {
    icon: [
      {
        url: "/buildlens-icon-light.png",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/buildlens-icon-dark.png",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = (await cookies()).get("theme")?.value;
  const dark = theme === "dark";

  return (
    <html
      lang="en"
      className={dark ? "dark" : undefined}
      suppressHydrationWarning
    >
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-full flex h-full flex-col bg-background text-on-surface antialiased`}
      >
        <ThemeSync />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
