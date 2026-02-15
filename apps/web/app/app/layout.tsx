import type { ReactNode } from 'react';
import Link from 'next/link';

const tabs = [
  { href: '/app/characters', label: 'Characters' },
  { href: '/app/decks', label: 'Decks' },
  { href: '/app/table', label: 'Table' },
  { href: '/app/quests', label: 'Quests' },
  { href: '/app/profile', label: 'Profile' }
];

export default function AppLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <div className="app-content">{children}</div>
      <nav className="tab-bar">
        {tabs.map((tab) => (
          <Link key={tab.href} className="tab-link" href={tab.href}>
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
