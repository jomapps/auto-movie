import React from 'react'
import './globals.css'

export const metadata = {
  description: 'Auto Movie - AI-powered movie creation platform',
  title: 'Auto Movie',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
