import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, ShieldCheck, Sparkles } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, fullName);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCredentials = (role) => {
    setError('');
    if (role === 'admin') {
      setEmail('admin@artstudio.com');
      setPassword('AdminPassword123!');
      setMode('login');
    } else {
      setEmail('customer@example.com');
      setPassword('CustomerPassword123!');
      setMode('login');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 600 }}>
            {mode === 'login' ? 'Sign in to Art Studio' : 'Create Customer Account'}
          </h3>
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* Mode Switcher */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
            <button
              onClick={() => { setMode('login'); setError(''); }}
              style={{
                flex: 1,
                padding: '0.65rem',
                borderBottom: mode === 'login' ? '2px solid var(--color-primary)' : 'none',
                fontWeight: mode === 'login' ? 600 : 400,
                color: mode === 'login' ? 'var(--color-primary)' : 'var(--color-text-muted)'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              style={{
                flex: 1,
                padding: '0.65rem',
                borderBottom: mode === 'register' ? '2px solid var(--color-primary)' : 'none',
                fontWeight: mode === 'register' ? 600 : 400,
                color: mode === 'register' ? 'var(--color-primary)' : 'var(--color-text-muted)'
              }}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    className="form-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {mode === 'register' && (
                <p className="form-help">Must be at least 6 characters long.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            >
              {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Customer Account'}
            </button>
          </form>

          {/* Quick 1-click test credentials */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px dashed var(--color-border)' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quick Evaluation Credentials:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => fillQuickCredentials('customer')}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.45rem', justifyContent: 'flex-start' }}
              >
                <User size={14} /> Demo Customer
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials('admin')}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.45rem', justifyContent: 'flex-start' }}
              >
                <ShieldCheck size={14} /> Studio Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
