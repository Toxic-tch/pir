export const metadata = {
  title: 'TOXIC YOBBY pair 1 — WhatsApp Pairing',
  description: 'Pair your WhatsApp device and get your Session ID sent directly to WhatsApp',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, background: '#060d1a', color: '#f0f4ff', fontFamily: "'Inter', sans-serif", WebkitFontSmoothing: 'antialiased' }}>
        {children}
      </body>
    </html>
  );
}
