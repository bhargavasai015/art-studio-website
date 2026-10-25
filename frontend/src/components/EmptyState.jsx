import React from 'react';
import { Palette } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Palette,
  title = 'No records found',
  description = 'There are currently no items to display in this category.',
  action = null
}) {
  return (
    <div className="state-box">
      <div style={{ display: 'inline-flex', padding: '1rem', background: '#f5f5f4', borderRadius: '50%', marginBottom: '1rem' }}>
        <Icon size={32} style={{ color: 'var(--color-text-muted)' }} />
      </div>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.25rem auto' }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
