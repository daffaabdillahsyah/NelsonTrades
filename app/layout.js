import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'NST Bootcamp',
  description: 'Trading education and journal platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-[#0f0f0f] text-gray-100 antialiased">
        {children}
      </body>
    </html>
  )
}
