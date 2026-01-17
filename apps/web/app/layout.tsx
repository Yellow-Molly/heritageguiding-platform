import './globals.css'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Root layout should not render html/body tags when using [locale] routing
  // The html/body tags are rendered by the [locale] layout for frontend routes
  // and by the (payload) layout for admin routes
  return children
}
