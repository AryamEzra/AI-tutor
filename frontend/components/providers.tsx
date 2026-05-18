"use client"

import React from "react"
import { ThemeProvider } from "./theme-provider"
import { AuthProvider } from "./auth/auth-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  )
}

export default Providers
