import './globals.css';

export const metadata = {
  title: 'Translation Validator',
  description: 'Validate semantic equivalence between Rust and C++ LLVM IR using state-of-the-art verification',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
