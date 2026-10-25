import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading art studio collection...' }) {
  return (
    <div className="state-box" style={{ padding: '4rem 1.5rem' }}>
      <Loader2
        size={36}
        className="state-icon"
        style={{
          animation: 'spin 1s linear infinite',
          color: 'var(--color-primary)',
          margin: '0 auto 1rem auto',
          display: 'block'
        }}
      />
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>{message}</p>
    </div>
  );
}
