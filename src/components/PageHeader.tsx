'use client';

import { useRouter } from 'next/navigation';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export default function PageHeader({ title, showBack = true, rightAction }: PageHeaderProps) {
  const router = useRouter();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backgroundColor: 'var(--color-primary)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        height: '56px',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(23,77,127,0.2)',
      }}
    >
      {showBack && (
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '8px',
          }}
          aria-label="Kembali"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
      )}
      <h1
        style={{
          flex: 1,
          fontSize: '17px',
          fontWeight: 600,
          margin: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </h1>
      {rightAction}
    </header>
  );
}
