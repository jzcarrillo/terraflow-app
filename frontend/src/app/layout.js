import { Inter } from 'next/font/google'
import './globals.css'
import { ConfigProvider } from '@/contexts/ConfigContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Terraflow - Land Registry System',
  description: 'Modern land registry management system',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <ConfigProvider>
          {children}
        </ConfigProvider>
      </body>
    </html>
  )
}