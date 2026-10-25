import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import { ShoppingBag, Calendar, Coffee, AlertCircle, Edit, Trash2, CheckCircle, Clock, X } from 'lucide-react';

export default function CustomerDashboard({ initialTab = 'orders', onNavigate }) {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(initialTab); // 'orders', 'bookings', 'pottery'

  // Data states
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [potteryRequests, setPotteryRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Edit Pottery Modal State
  const [editingRequest, setEditingRequest] = useState(null);
  const [editQty, setEditQty] = useState(1);
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Compute minimum needed-by date: at least 14 days away
  const today = new Date();
  const minDateObj = new Date();
  minDateObj.setDate(today.getDate() + 14);
  const minPotteryDateStr = minDateObj.toISOString().split('T')[0];

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersData, bookingsData, potteryData] = await Promise.all([
        apiRequest('/orders'),
        apiRequest('/bookings'),
        apiRequest('/pottery')
      ]);

      setOrders(ordersData.orders || []);
      setBookings(bookingsData.bookings || []);
      setPotteryRequests(potteryData.requests || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch your account records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Helper to test if booking can still be cancelled (at least 3 days away)
  const canCancelBooking = (bookingDateStr, status) => {
    if (status === 'cancelled' || status === 'declined') return false;
    const parts = bookingDateStr.split('-');
    if (parts.length !== 3) return false;
    const target = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
    const now = new Date();
    const todayMidnight = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const diffDays = Math.round((target - todayMidnight) / (1000 * 60 * 60 * 24));
    return diffDays >= 3;
  };

  // Actions
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? The painting will become available for other collectors.')) {
      return;
    }
    try {
      await apiRequest(`/orders/${orderId}/cancel`, { method: 'PUT' });
      setActionMessage({ type: 'success', text: 'Order cancelled successfully. The artwork is now back in the studio collection.' });
      fetchAllData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to cancel order.' });
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this wall painting booking?')) {
      return;
    }
    try {
      await apiRequest(`/bookings/${bookingId}/cancel`, { method: 'PUT' });
      setActionMessage({ type: 'success', text: 'Wall mural booking cancelled.' });
      fetchAllData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to cancel booking.' });
    }
  };

  const handleCancelPottery = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this pottery commission request?')) {
      return;
    }
    try {
      await apiRequest(`/pottery/${requestId}/cancel`, { method: 'PUT' });
      setActionMessage({ type: 'success', text: 'Pottery commission request cancelled.' });
      fetchAllData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to cancel pottery request.' });
    }
  };

  const openEditPotteryModal = (req) => {
    setEditingRequest(req);
    setEditQty(req.quantity);
    setEditDate(req.needed_by);
    setEditNotes(req.notes || '');
    setEditError('');
  };

  const handleSavePotteryEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');

    try {
      await apiRequest(`/pottery/${editingRequest.id}`, {
        method: 'PUT',
        body: {
          quantity: parseInt(editQty, 10),
          needed_by: editDate,
          notes: editNotes.trim()
        }
      });

      setEditingRequest(null);
      setActionMessage({ type: 'success', text: 'Pottery request updated successfully.' });
      fetchAllData();
    } catch (err) {
      setEditError(err.message || 'Failed to update pottery request.');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 4rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.4rem' }}>
          Customer Account Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Welcome back, <strong>{user?.full_name}</strong> ({user?.email}). Manage your art orders, mural bookings, and custom pottery commissions.
        </p>
      </div>

      {actionMessage.text && (
        <div
          className={`alert ${actionMessage.type === 'error' ? 'alert-error' : 'alert-success'}`}
          style={{ marginBottom: '1.5rem' }}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage({ type: '', text: '' })}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('orders')}
          className="btn"
          style={{
            borderBottom: activeTab === 'orders' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'orders' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontWeight: activeTab === 'orders' ? 600 : 500,
            borderRadius: '0'
          }}
        >
          <ShoppingBag size={16} /> Painting Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className="btn"
          style={{
            borderBottom: activeTab === 'bookings' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'bookings' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontWeight: activeTab === 'bookings' ? 600 : 500,
            borderRadius: '0'
          }}
        >
          <Calendar size={16} /> Wall Mural Bookings ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('pottery')}
          className="btn"
          style={{
            borderBottom: activeTab === 'pottery' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'pottery' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontWeight: activeTab === 'pottery' ? 600 : 500,
            borderRadius: '0'
          }}
        >
          <Coffee size={16} /> Custom Pottery Requests ({potteryRequests.length})
        </button>
      </div>

      {loading && <LoadingSpinner message="Retrieving your collection history..." />}
      {error && <ErrorMessage message={error} onRetry={fetchAllData} />}

      {!loading && !error && (
        <div>
          {/* TAB 1: Painting Orders */}
          {activeTab === 'orders' && (
            <div>
              {orders.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title="No painting orders placed yet"
                  description="You have not purchased any original paintings yet. Explore our curated gallery to find one-of-a-kind art pieces."
                  action={
                    <button onClick={() => onNavigate('gallery')} className="btn btn-primary">
                      Browse Studio Gallery
                    </button>
                  }
                />
              ) : (
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  {orders.map((order) => {
                    const isPlaced = order.status === 'placed';
                    return (
                      <div key={order.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                          <img
                            src={order.painting_image_url}
                            alt={order.painting_title}
                            style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                          />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <h3 className="serif-font" style={{ fontSize: '1.35rem' }}>{order.painting_title}</h3>
                              <StatusBadge status={order.status} />
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                              Artist: {order.painting_artist} • Paid: <strong>${order.price_paid.toFixed(2)}</strong>
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', marginTop: '0.25rem' }}>
                              Order #{order.id} • Date: {order.created_at}
                              {order.cancelled_at && ` • Cancelled: ${order.cancelled_at}`}
                            </p>
                          </div>
                        </div>

                        <div>
                          {isPlaced ? (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="btn btn-danger"
                              style={{ fontSize: '0.85rem' }}
                            >
                              <Trash2 size={15} /> Cancel Order
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                              Cancelled & returned to gallery
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Wall Bookings */}
          {activeTab === 'bookings' && (
            <div>
              {bookings.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No wall mural bookings yet"
                  description="You have not requested any wall painting dates. Book a date between 7 and 90 days away to transform your walls."
                  action={
                    <button onClick={() => onNavigate('wall-booking')} className="btn btn-primary">
                      Book a Wall Mural
                    </button>
                  }
                />
              ) : (
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  {bookings.map((booking) => {
                    const cancellable = canCancelBooking(booking.booking_date, booking.status);
                    return (
                      <div key={booking.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Scheduled for {booking.booking_date}</h3>
                            <StatusBadge status={booking.status} />
                          </div>
                          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                            📍 {booking.address}
                          </p>
                          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            Surface: <strong>{booking.wall_size} sq ft</strong> • Rate: ${booking.rate_per_sqft}/sq ft • Total: <strong style={{ color: 'var(--color-primary)' }}>${booking.total_price.toFixed(2)}</strong>
                          </p>
                        </div>

                        <div>
                          {booking.status === 'requested' || booking.status === 'confirmed' ? (
                            cancellable ? (
                              <button
                                onClick={() => handleCancelBooking(booking.id)}
                                className="btn btn-danger"
                                style={{ fontSize: '0.85rem' }}
                              >
                                <Trash2 size={15} /> Cancel Booking
                              </button>
                            ) : (
                              <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)', background: '#fff1f2', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                                Cannot cancel within 3 days of booking date
                              </div>
                            )
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                              Status: {booking.status}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Pottery Requests */}
          {activeTab === 'pottery' && (
            <div>
              {potteryRequests.length === 0 ? (
                <EmptyState
                  icon={Coffee}
                  title="No custom pottery requests"
                  description="You have not requested custom wheel-thrown ceramics yet. Pick your silhouette, glaze, and delivery deadline to start."
                  action={
                    <button onClick={() => onNavigate('pottery')} className="btn btn-primary">
                      Request Custom Ceramics
                    </button>
                  }
                />
              ) : (
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  {potteryRequests.map((req) => {
                    const isRequested = req.status === 'requested';
                    return (
                      <div key={req.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{req.quantity}× {req.item_name}</h3>
                            <StatusBadge status={req.status} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', fontSize: '0.875rem' }}>
                            <span style={{
                              display: 'inline-block',
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              backgroundColor: req.glaze_hex_code,
                              border: '1px solid #d6d3d1'
                            }} />
                            <span>Glaze: <strong>{req.glaze_name}</strong> ({req.glaze_finish})</span>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            Needed By: <strong>{req.needed_by}</strong>
                            {req.notes && ` • Notes: "${req.notes}"`}
                          </p>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {isRequested ? (
                            <>
                              <button
                                onClick={() => openEditPotteryModal(req)}
                                className="btn btn-secondary"
                                style={{ fontSize: '0.85rem' }}
                              >
                                <Edit size={14} /> Edit Request
                              </button>
                              <button
                                onClick={() => handleCancelPottery(req.id)}
                                className="btn btn-danger"
                                style={{ fontSize: '0.85rem' }}
                              >
                                <Trash2 size={14} /> Cancel
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                              Status: {req.status} (Locked)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Pottery Modal */}
      {editingRequest && (
        <div className="modal-backdrop" onClick={() => !editLoading && setEditingRequest(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 600 }}>Edit Pottery Commission</h3>
              <button
                disabled={editLoading}
                onClick={() => setEditingRequest(null)}
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePotteryEdit} style={{ padding: '1.5rem' }}>
              {editError && (
                <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                  <span>{editError}</span>
                </div>
              )}

              <div style={{ marginBottom: '1rem', background: '#faf9f6', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <strong>Vessel & Glaze:</strong> {editingRequest.item_name} with {editingRequest.glaze_name} glaze
              </div>

              <div className="form-group">
                <label className="form-label">Quantity (1 to 12) *</label>
                <select
                  className="form-select"
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'piece' : 'pieces'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Needed-By Date (≥ 14 days away) *</label>
                <input
                  type="date"
                  required
                  min={minPotteryDateStr}
                  className="form-input"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Custom Specifications / Notes</label>
                <textarea
                  rows={3}
                  className="form-textarea"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  disabled={editLoading}
                  onClick={() => setEditingRequest(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="btn btn-primary"
                >
                  {editLoading ? 'Saving Changes...' : 'Update Commission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
