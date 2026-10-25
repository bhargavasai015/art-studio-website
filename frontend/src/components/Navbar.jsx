import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Palette, Calendar, Coffee, User, LogOut, Shield, LayoutDashboard } from 'lucide-react';

export default function Navbar({ activePage, setActivePage, onOpenAuth }) {
  const { user, isAuthenticated, isAdmin, isCustomer, logout } = useAuth();

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px'
      }}>
        {/* Brand / Logo */}
        <div
          onClick={() => setActivePage('gallery')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Palette size={22} />
          </div>
          <div>
            <div className="serif-font" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text-main)', lineHeight: 1.1 }}>
              GDGC Artisans
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Art Studio & Workshop
            </div>
          </div>
        </div>

        {/* Primary Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setActivePage('gallery')}
            className="btn"
            style={{
              color: activePage === 'gallery' ? 'var(--color-primary)' : 'var(--color-text-main)',
              fontWeight: activePage === 'gallery' ? 600 : 500,
              background: activePage === 'gallery' ? 'var(--color-primary-light)' : 'transparent',
              padding: '0.5rem 0.85rem'
            }}
          >
            <Palette size={16} /> Paintings
          </button>

          <button
            onClick={() => setActivePage('wall-booking')}
            className="btn"
            style={{
              color: activePage === 'wall-booking' ? 'var(--color-primary)' : 'var(--color-text-main)',
              fontWeight: activePage === 'wall-booking' ? 600 : 500,
              background: activePage === 'wall-booking' ? 'var(--color-primary-light)' : 'transparent',
              padding: '0.5rem 0.85rem'
            }}
          >
            <Calendar size={16} /> Book Wall Mural
          </button>

          <button
            onClick={() => setActivePage('pottery')}
            className="btn"
            style={{
              color: activePage === 'pottery' ? 'var(--color-primary)' : 'var(--color-text-main)',
              fontWeight: activePage === 'pottery' ? 600 : 500,
              background: activePage === 'pottery' ? 'var(--color-primary-light)' : 'transparent',
              padding: '0.5rem 0.85rem'
            }}
          >
            <Coffee size={16} /> Custom Pottery
          </button>

          {isCustomer && (
            <button
              onClick={() => setActivePage('customer-dashboard')}
              className="btn"
              style={{
                color: activePage === 'customer-dashboard' ? 'var(--color-primary)' : 'var(--color-text-main)',
                fontWeight: activePage === 'customer-dashboard' ? 600 : 500,
                background: activePage === 'customer-dashboard' ? 'var(--color-primary-light)' : 'transparent',
                padding: '0.5rem 0.85rem'
              }}
            >
              <User size={16} /> My Account
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setActivePage('admin-dashboard')}
              className="btn"
              style={{
                color: activePage === 'admin-dashboard' ? 'var(--color-primary)' : 'var(--color-text-main)',
                fontWeight: activePage === 'admin-dashboard' ? 600 : 500,
                background: activePage === 'admin-dashboard' ? 'var(--color-primary-light)' : 'transparent',
                padding: '0.5rem 0.85rem'
              }}
            >
              <LayoutDashboard size={16} /> Studio Admin
            </button>
          )}
        </nav>

        {/* User / Authentication actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.full_name}</div>
                <div style={{
                  fontSize: '0.72rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: isAdmin ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>
                  {isAdmin ? <Shield size={10} /> : <User size={10} />}
                  {user.role}
                </div>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn btn-primary"
              style={{ padding: '0.55rem 1.25rem' }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
