import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { Calendar, Ruler, MapPin, DollarSign, CheckCircle, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function WallBookingPage({ onOpenAuth, onNavigateToBookings }) {
  const { isAuthenticated, isCustomer, isAdmin } = useAuth();

  const [ratePerSqFt, setRatePerSqFt] = useState(150.0);
  const [bookedDates, setBookedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [bookingDate, setBookingDate] = useState('');
  const [wallSize, setWallSize] = useState(120);
  const [address, setAddress] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedBooking, setSubmittedBooking] = useState(null);

  // Compute allowed min & max dates: 7 to 90 days away
  const today = new Date();
  const minDateObj = new Date();
  minDateObj.setDate(today.getDate() + 7);
  const minDateStr = minDateObj.toISOString().split('T')[0];

  const maxDateObj = new Date();
  maxDateObj.setDate(today.getDate() + 90);
  const maxDateStr = maxDateObj.toISOString().split('T')[0];

  const loadBookingConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/bookings/booked-dates');
      setBookedDates(data.bookedDates || []);
      if (data.rate_per_sqft) {
        setRatePerSqFt(data.rate_per_sqft);
      }
    } catch (err) {
      setError(err.message || 'Failed to load booking schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookingConfig();
  }, []);

  const isDateBooked = (dateStr) => bookedDates.includes(dateStr);

  const calculateTotal = () => {
    const size = parseFloat(wallSize) || 0;
    return (size * ratePerSqFt).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }

    if (isAdmin) {
      setSubmitError('Studio admins cannot submit customer bookings. Please use a customer account.');
      return;
    }

    if (isDateBooked(bookingDate)) {
      setSubmitError(`The date ${bookingDate} is already booked. Please choose an available date.`);
      return;
    }

    setSubmitLoading(true);

    try {
      const data = await apiRequest('/bookings', {
        method: 'POST',
        body: {
          booking_date: bookingDate,
          wall_size: parseFloat(wallSize),
          address: address.trim()
        }
      });

      setSubmittedBooking(data.booking);
      loadBookingConfig(); // Refresh booked dates
    } catch (err) {
      setSubmitError(err.message || 'Failed to request wall mural booking.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 4rem 1.5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--color-primary)',
            fontSize: '0.85rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.5rem'
          }}>
            <Sparkles size={14} /> Bespoke Murals & Architectural Art
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
            Book a Wall Painting
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Commission our resident artists to hand-paint a custom mural on your residential or commercial wall.
          </p>
        </div>

        {loading && <LoadingSpinner message="Checking calendar availability..." />}
        {error && <ErrorMessage message={error} onRetry={loadBookingConfig} />}

        {!loading && submittedBooking ? (
          <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto'
            }}>
              <CheckCircle size={36} />
            </div>
            <h2 className="serif-font" style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
              Booking Request Received!
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginBottom: '1.75rem' }}>
              Your wall painting commission for <strong>{submittedBooking.booking_date}</strong> has been logged with status <strong>Requested</strong>.
            </p>

            <div style={{
              background: '#fcfbf9',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              maxWidth: '480px',
              margin: '0 auto 2rem auto',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Date:</span>
                <strong>{submittedBooking.booking_date}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Wall Size:</span>
                <strong>{submittedBooking.wall_size} sq ft</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Rate:</span>
                <span>₹{submittedBooking.rate_per_sqft}/sq ft</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderTop: '1px solid var(--color-border)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>Total Price:</span>
                <strong style={{ color: 'var(--color-primary)', fontSize: '1.15rem' }}>
                  ₹{Number(submittedBooking.total_price).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={onNavigateToBookings}
                className="btn btn-primary"
              >
                View in My Account
              </button>
              <button
                onClick={() => {
                  setSubmittedBooking(null);
                  setBookingDate('');
                  setAddress('');
                }}
                className="btn btn-secondary"
              >
                Book Another Date
              </button>
            </div>
          </div>
        ) : !loading && (
          <div className="card" style={{ padding: '2rem 2.5rem' }}>
            {/* Rules Summary Banner */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              background: '#faf9f6',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '2rem',
              fontSize: '0.85rem'
            }}>
              <div>
                <strong>📅 Booking Window:</strong>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>7 to 90 days in advance</p>
              </div>
              <div>
                <strong>📐 Wall Dimensions:</strong>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>10 to 500 sq ft surface</p>
              </div>
              <div>
                <strong>💰 Studio Rate:</strong>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>₹{ratePerSqFt.toFixed(0)} / sq ft</p>
              </div>
              <div>
                <strong>⏱️ Cancellation:</strong>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Up to 3 days before date</p>
              </div>
            </div>

            {submitError && (
              <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Date Selection */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Target Mural Date *</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Allowed: {minDateStr} to {maxDateStr}
                  </span>
                </label>
                <input
                  type="date"
                  required
                  min={minDateStr}
                  max={maxDateStr}
                  className="form-input"
                  value={bookingDate}
                  onChange={(e) => {
                    setBookingDate(e.target.value);
                    setSubmitError('');
                  }}
                />
                {bookingDate && isDateBooked(bookingDate) && (
                  <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertCircle size={14} /> This date has already been booked. Please choose another date.
                  </p>
                )}
                {bookedDates.length > 0 && (
                  <p className="form-help">
                    Note: Dates already reserved by other clients cannot be selected. ({bookedDates.length} booked dates currently on record).
                  </p>
                )}
              </div>

              {/* Wall Size with Live Slider */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Wall Size (Square Feet) *</label>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {wallSize} sq ft
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="5"
                  value={wallSize}
                  onChange={(e) => setWallSize(e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer', margin: '0.5rem 0' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                  <span>Min: 10 sq ft</span>
                  <span>Small Accent (50)</span>
                  <span>Living Room (150)</span>
                  <span>Commercial (350)</span>
                  <span>Max: 500 sq ft</span>
                </div>
              </div>

              {/* Service Address */}
              <div className="form-group">
                <label className="form-label">Service / Installation Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 742 Evergreen Terrace, Springfield, IL 62704"
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <p className="form-help">Our muralist team brings all primer, ladders, acrylics, and protective coatings directly to your site.</p>
              </div>

              {/* Live Price Estimation Card */}
              <div style={{
                background: '#fefce8',
                border: '1px solid #fef08a',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                margin: '1.75rem 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#854d0e', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                    Calculated Commission Price
                  </span>
                  <div style={{ fontSize: '0.8rem', color: '#a16207', marginTop: '0.2rem' }}>
                    {wallSize} sq ft × ₹{ratePerSqFt}/sq ft
                  </div>
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#78350f' }}>
                  ₹{Number(calculateTotal()).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Submit CTA */}
              <div>
                {!isAuthenticated ? (
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.85rem' }}
                  >
                    Sign In as Customer to Book
                  </button>
                ) : isAdmin ? (
                  <div className="alert alert-info">
                    <Info size={18} />
                    <span>You are logged in as Studio Admin. Admins review and confirm bookings in the Studio Admin panel.</span>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={submitLoading || isDateBooked(bookingDate)}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.85rem' }}
                  >
                    {submitLoading ? 'Submitting Booking Request...' : 'Submit Wall Mural Booking'}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
