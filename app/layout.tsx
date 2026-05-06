export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CapacitApp',
  description: 'Plataforma de capacitaciones interactivas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}