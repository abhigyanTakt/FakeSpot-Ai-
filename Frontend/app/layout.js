import './globals.css'

export const metadata = {
  title: 'FakeSpot - AI Review Detector',
  description: 'Advanced machine learning powered detection system',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}