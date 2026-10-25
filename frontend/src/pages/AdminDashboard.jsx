import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import { Calendar, Coffee, ShoppingBag, CheckCircle, XCircle, ShieldCheck, AlertCircle, RefreshCw, X } from 'lucide-react';

export default function AdminDashboard({ onNavigateToGallery }) {
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings', 'pottery', 'orders'

  const [bookings, setBookings] = useState([]);
  const [potteryRequests, setPotteryRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  const loadAllAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [bData, pData, oData] = await Promise.all([
        apiRequest('/bookings'),
        apiRequest('/pottery'),
        apiRequest('/orders')
      ]);

      setBookings(bData.bookings || []);
      setPotteryRequests(pData.requests || []);
      setOrders(oData.orders || []);
    } catch (err) {
      setError(err.message || 'Failed to load studio management data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  // Admin Wall Booking Actions
  const handleConfirmBooking = async (id) => {
    try {
      await apiRequest(`/bookings/${id}/confirm`, { method: 'PUT' });
      setActionMessage({ type: 'success', text: `Booking #${id} confirmed successfully.` });
      loadAllAdminData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to confirm booking.' });
    }
  };

  const handleDeclineBooking = async (id) => {
    try {
      await apiRequest(`/bookings/${id}/decline`, { method: 'PUT' });
      setActionMessage({ type: 'success', text: `Booking #${id} declined.` });
      loadAllAdminData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to decline booking.' });
    }
  };

  // Admin Pottery Request Actions
  const handleAcceptPottery = async (id) => {
    try {
      await apiRequest(`/pottery/${id}/accept`, { method: 'PUT' });
      setActionMessage({ type: 'success', text: `Pottery commission #${id} accepted.` });
      loadAllAdminData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to accept pottery request.' });
    }
  };

  const handleDeclinePottery = async (id) => {
    try {
      await apiRequest(`/pottery/${id}/decline`, { method: 'PUT' });
      setActionMessage({ type: 'success', text: `Pottery commission #${id} declined.` });
      loadAllAdminData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to decline pottery request.' });
    }
  };

  const pendingBookingsCount = bookings.filter((b) => b.status === 'requested').length;
  const pendingPotteryCount = potteryRequests.filter((p) => p.status === 'requested').length;
  const activeOrdersCount = orders.filter((o) => o.status === 'placed').length;

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 4rem 1.5rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            <ShieldCheck size={16} /> Studio Operations & Administration
          </div>
          <h1 style={{ fontSize: '2.25rem' }}>Studio Control Panel</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Review customer mural bookings, evaluate custom pottery commissions, and track studio orders.
          </p>
        </div>

        <button
          onClick={loadAllAdminData}
          className="btn btn-secondary"
          style={{ fontSize: '0.875rem' }}
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
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

      {/* Summary KPI Badges */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Pending Mural Bookings
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: pendingBookingsCount > 0 ? '#b45309' : 'var(--color-text-main)', marginTop: '0.25rem' }}>
            {pendingBookingsCount}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Pending Pottery Requests
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: pendingPotteryCount > 0 ? '#b45309' : 'var(--color-text-main)', marginTop: '0.25rem' }}>
            {pendingPotteryCount}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Active Artwork Orders
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '0.25rem' }}>
            {activeOrdersCount}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem' }}>
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
          <Coffee size={16} /> Pottery Commission Requests ({potteryRequests.length})
        </button>
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
          <ShoppingBag size={16} /> All Painting Purchases ({orders.length})
        </button>
      </div>

      {loading && <LoadingSpinner message="Loading studio management records..." />}
      {error && <ErrorMessage message={error} onRetry={loadAllAdminData} />}

      {!loading && !error && (
        <div>
          {/* TAB 1: Wall Bookings Management */}
          {activeTab === 'bookings' && (
            <div>
              {bookings.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No wall mural bookings on record"
                  description="When customers request wall painting commissions, they will appear here for studio confirmation or declining."
                />
              ) : (
                <div className="table-container">
                  <table className="styled-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Client</th>
                        <th>Booking Date</th>
                        <th>Size & Rate</th>
                        <th>Total</th>
                        <th>Address</th>
                        <th>Status</th>
                        <th>Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => {
                        const isPending = booking.status === 'requested';
                        return (
                          <tr key={booking.id}>
                            <td><strong>#{booking.id}</strong></td>
                            <td>
                              <div><strong>{booking.customer_name}</strong></div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{booking.customer_email}</div>
                            </td>
                            <td><strong>{booking.booking_date}</strong></td>
                            <td>{booking.wall_size} sq ft @ ${booking.rate_per_sqft}/sq ft</td>
                            <td><strong style={{ color: 'var(--color-primary)' }}>${booking.total_price.toFixed(2)}</strong></td>
                            <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={booking.address}>
                              {booking.address}
                            </td>
                            <td><StatusBadge status={booking.status} /></td>
                            <td>
                              {isPending ? (
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button
                                    onClick={() => handleConfirmBooking(booking.id)}
                                    className="btn btn-success"
                                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                    title="Confirm this booking"
                                  >
                                    <CheckCircle size={14} /> Confirm
                                  </button>
                                  <button
                                    onClick={() => handleDeclineBooking(booking.id)}
                                    className="btn btn-danger"
                                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                    title="Decline this booking"
                                  >
                                    <XCircle size={14} /> Decline
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Processed</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Pottery Requests Management */}
          {activeTab === 'pottery' && (
            <div>
              {potteryRequests.length === 0 ? (
                <EmptyState
                  icon={Coffee}
                  title="No custom pottery requests"
                  description="When customers submit pottery commission requests, they will appear here for studio review."
                />
              ) : (
                <div className="table-container">
                  <table className="styled-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Client</th>
                        <th>Item Shape</th>
                        <th>Glaze</th>
                        <th>Qty</th>
                        <th>Needed By</th>
                        <th>Notes</th>
                        <th>Status</th>
                        <th>Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {potteryRequests.map((req) => {
                        const isPending = req.status === 'requested';
                        return (
                          <tr key={req.id}>
                            <td><strong>#{req.id}</strong></td>
                            <td>
                              <div><strong>{req.customer_name}</strong></div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{req.customer_email}</div>
                            </td>
                            <td><strong>{req.item_name}</strong></td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '50%',
                                  backgroundColor: req.glaze_hex_code,
                                  border: '1px solid #d6d3d1'
                                }} />
                                <span>{req.glaze_name} ({req.glaze_finish})</span>
                              </div>
                            </td>
                            <td><strong>{req.quantity}</strong></td>
                            <td><strong>{req.needed_by}</strong></td>
                            <td style={{ maxWidth: '180px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                              {req.notes || '—'}
                            </td>
                            <td><StatusBadge status={req.status} /></td>
                            <td>
                              {isPending ? (
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button
                                    onClick={() => handleAcceptPottery(req.id)}
                                    className="btn btn-success"
                                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                    title="Accept this custom pottery commission"
                                  >
                                    <CheckCircle size={14} /> Accept
                                  </button>
                                  <button
                                    onClick={() => handleDeclinePottery(req.id)}
                                    className="btn btn-danger"
                                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                    title="Decline this request"
                                  >
                                    <XCircle size={14} /> Decline
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Processed</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Painting Purchases Overview */}
          {activeTab === 'orders' && (
            <div>
              {orders.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title="No painting purchases recorded yet"
                  description="When collectors purchase paintings from the gallery, their transactions will appear here."
                />
              ) : (
                <div className="table-container">
                  <table className="styled-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Collector</th>
                        <th>Artwork</th>
                        <th>Price Paid</th>
                        <th>Status</th>
                        <th>Order Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td><strong>#{order.id}</strong></td>
                          <td>
                            <div><strong>{order.customer_name}</strong></div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{order.customer_email}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <img
                                src={order.painting_image_url}
                                alt={order.painting_title}
                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                              />
                              <div>
                                <strong>{order.painting_title}</strong>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{order.painting_artist}</div>
                              </div>
                            </div>
                          </td>
                          <td><strong style={{ color: 'var(--color-primary)' }}>${order.price_paid.toFixed(2)}</strong></td>
                          <td><StatusBadge status={order.status} /></td>
                          <td>{order.created_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
