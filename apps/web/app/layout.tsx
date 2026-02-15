import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Character Commander',
  description: 'Lore-consistent Commander companion app.'
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="brand">Character Commander</div>
          <nav className="nav">Beta Blueprint</nav>
        </header>
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
