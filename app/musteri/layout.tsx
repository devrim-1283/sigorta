export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Auth check is done in the page component (client-side)
  // This allows for better error handling and user feedback
  return <>{children}</>
}

