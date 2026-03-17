import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Karty Proti Maturitě 2026',
  description: 'Česká ultra-unhinged verze Cards Against Humanity pro maturák',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className="dark">
      <body className="bg-zinc-950 text-white antialiased">{children}</body>
    </html>
  )
}