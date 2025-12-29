import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Local SEO Generator - 7 Tools für lokale Unternehmen',
  description: 'Generiere SEO-optimierte Inhalte für dein lokales Business: Service Pages, GBP Posts, Review Responses, FAQs und mehr.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="dark">
      <body className="bg-gray-950 text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
