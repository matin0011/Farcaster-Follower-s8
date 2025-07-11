import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Follow for Coins - Farcaster Mini App",
  description:
    "Follow users, earn coins, order followers! A Farcaster Mini App for earning coins and increasing followers",
  other: {
    "fc:frame": JSON.stringify({
      version: "1",
      imageUrl: "/api/og",
      button: {
        title: "🪙 Start Now",
        action: {
          type: "launch_frame",
          name: "Follow for Coins",
          url: "/",
          splashImageUrl: "/icon.png",
          splashBackgroundColor: "#3b82f6",
        },
      },
    }),
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
