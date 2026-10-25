import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import GalleryPage from './pages/GalleryPage';
import WallBookingPage from './pages/WallBookingPage';
import PotteryPage from './pages/PotteryPage';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { Palette, Heart, Shield, Sparkles } from 'lucide-react';

function AppContent() {
  const [activePage, setActivePage] = useState('gallery');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [customerInitialTab, setCustomerInitialTab] = useState('orders');

  const { user, isAdmin, isCustomer, isAuthenticated } = useAuth();

  const handleNavigateToOrders = () => {
    setCustomerInitialTab('orders');
    setActivePage('customer-dashboard');
  };

  const handleNavigateToBookings = () => {
    setCustomerInitialTab('bookings');
    setActivePage('customer-dashboard');
  };

  const handleNavigateToRequests = () => {
    setCustomerInitialTab('pottery');
    setActivePage('customer-dashboard');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navigation Header */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Page Content */}
      <main style={{ flexGrow: 1 }}>
        {activePage === 'gallery' && (
          <GalleryPage
            onOpenAuth={() => setIsAuthOpen(true)}
            onNavigateToOrders={handleNavigateToOrders}
          />
        )}

        {activePage === 'wall-booking' && (
          <WallBookingPage
            onOpenAuth={() => setIsAuthOpen(true)}
            onNavigateToBookings={handleNavigateToBookings}
          />
        )}

        {activePage === 'pottery' && (
          <PotteryPage
            onOpenAuth={() => setIsAuthOpen(true)}
            onNavigateToRequests={handleNavigateToRequests}
          />
        )}

        {activePage === 'customer-dashboard' && (
          isAuthenticated ? (
            <CustomerDashboard
              initialTab={customerInitialTab}
              onNavigate={(page) => setActivePage(page)}
            />
          ) : (
            <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
              <h2 style={{ marginBottom: '1rem' }}>Please Sign In</h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                You must be logged in as a customer to view your account dashboard.
              </p>
              <button onClick={() => setIsAuthOpen(true)} className="btn btn-primary">
                Sign In
              </button>
            </div>
          )
        )}

        {activePage === 'admin-dashboard' && (
          isAdmin ? (
            <AdminDashboard onNavigateToGallery={() => setActivePage('gallery')} />
          ) : (
            <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
              <div style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>
                <Shield size={48} style={{ margin: '0 auto' }} />
              </div>
              <h2 style={{ marginBottom: '0.5rem' }}>Access Restricted</h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
                The Studio Admin panel is reserved for studio staff. Please sign in with an administrator account to view studio bookings and commissions.
              </p>
              <button onClick={() => setIsAuthOpen(true)} className="btn btn-primary">
                Sign In as Admin
              </button>
            </div>
          )
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Footer */}
      <footer style={{
        backgroundColor: '#1c1917',
        color: '#d6d3d1',
        borderTop: '1px solid #292524',
        padding: '3rem 1.5rem 2rem 1.5rem',
        marginTop: 'auto',
        fontSize: '0.875rem'
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2.5rem',
            marginBottom: '2.5rem'
          }}>
            <div>
              <div className="serif-font" style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '0.5rem' }}>
                GDGC Artisans Studio
              </div>
              <p style={{ color: '#a8a29e', lineHeight: 1.6, marginBottom: '1rem' }}>
                An independent fine arts workshop specializing in one-of-a-kind original paintings, on-site wall mural commissions, and wheel-thrown custom ceramics.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', fontSize: '0.8rem' }}>
                <Sparkles size={14} /> Full-Stack Submission Built for GDGC
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Studio Services
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><button onClick={() => setActivePage('gallery')} style={{ color: '#d6d3d1' }}>Original Painting Gallery</button></li>
                <li><button onClick={() => setActivePage('wall-booking')} style={{ color: '#d6d3d1' }}>Wall Mural Commission (7–90 Days)</button></li>
                <li><button onClick={() => setActivePage('pottery')} style={{ color: '#d6d3d1' }}>Handcrafted Pottery (1–12 Pieces)</button></li>
              </ul>
            </div>

            <div>
              <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Testing Accounts
              </div>
              <div style={{ color: '#a8a29e', lineHeight: 1.5 }}>
                <p><strong>Customer:</strong> customer@example.com</p>
                <p><strong>Password:</strong> CustomerPassword123!</p>
                <div style={{ height: '0.5rem' }} />
                <p><strong>Admin:</strong> admin@artstudio.com</p>
                <p><strong>Password:</strong> AdminPassword123!</p>
              </div>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid #292524',
            paddingTop: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            color: '#78716c',
            fontSize: '0.8rem'
          }}>
            <div>
              © 2026 GDGC Art Studio. All rights reserved. Persistent SQLite Database • Server-Enforced RBAC • Atomic Concurrency Control.
            </div>
            <div>
              Designed & Developed for GDGC Web Development Assignment
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
