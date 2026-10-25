import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import { Palette, Plus, Edit, ShoppingBag, CheckCircle, AlertCircle, Sparkles, Filter, X } from 'lucide-react';

export default function GalleryPage({ onOpenAuth, onNavigateToOrders }) {
  const { user, isAuthenticated, isAdmin, isCustomer } = useAuth();

  const [paintings, setPaintings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'available', 'sold'

  // Purchase modal state
  const [purchasingPainting, setPurchasingPainting] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);

  // Admin add/edit modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPainting, setEditingPainting] = useState(null); // null for add, painting object for edit
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    description: '',
    medium: 'Oil on Canvas',
    dimensions: '24" x 36"',
    price: '',
    image_url: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const loadPaintings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/paintings');
      setPaintings(data.paintings);
    } catch (err) {
      setError(err.message || 'Failed to load paintings gallery.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaintings();
  }, []);

  const filteredPaintings = paintings.filter((p) => {
    if (filter === 'available') return p.status === 'available';
    if (filter === 'sold') return p.status === 'sold';
    return true;
  });

  const handlePurchase = async () => {
    if (!purchasingPainting) return;
    setPurchaseLoading(true);
    setPurchaseError('');

    try {
      const data = await apiRequest('/orders', {
        method: 'POST',
        body: { painting_id: purchasingPainting.id }
      });

      setPurchaseSuccess(data.order);
      // Refresh list to update status
      loadPaintings();
    } catch (err) {
      setPurchaseError(err.message || 'Could not complete purchase.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingPainting(null);
    setFormData({
      title: '',
      artist: user?.full_name || 'Studio Resident Artist',
      description: '',
      medium: 'Oil on Canvas',
      dimensions: '24" x 36"',
      price: '',
      image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80'
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditModal = (p) => {
    if (p.status !== 'available') {
      alert('Only available paintings can be edited.');
      return;
    }
    setEditingPainting(p);
    setFormData({
      title: p.title,
      artist: p.artist,
      description: p.description || '',
      medium: p.medium || '',
      dimensions: p.dimensions || '',
      price: p.price.toString(),
      image_url: p.image_url || ''
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      if (editingPainting) {
        // Edit existing painting (Admin only, only while available)
        await apiRequest(`/paintings/${editingPainting.id}`, {
          method: 'PUT',
          body: {
            ...formData,
            price: parseFloat(formData.price)
          }
        });
      } else {
        // Add new painting
        await apiRequest('/paintings', {
          method: 'POST',
          body: {
            ...formData,
            price: parseFloat(formData.price)
          }
        });
      }

      setIsFormOpen(false);
      loadPaintings();
    } catch (err) {
      setFormError(err.message || 'Failed to save painting.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 4rem 1.5rem' }}>
      {/* Hero Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '1.5rem',
        marginBottom: '2.5rem',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: '2rem'
      }}>
        <div style={{ maxWidth: '640px' }}>
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
            <Sparkles size={14} /> One-Of-A-Kind Original Art
          </div>
          <h1 style={{ fontSize: '2.75rem', color: 'var(--color-text-main)', marginBottom: '0.75rem' }}>
            The Studio Gallery
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Every piece in our gallery is an authentic, handcrafted original. Once an artwork is purchased, it is removed from circulation unless cancelled by the collector.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {isAdmin && (
            <button onClick={openAddModal} className="btn btn-primary">
              <Plus size={16} /> Add Painting
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'inline-flex', background: '#f5f5f4', padding: '0.3rem', borderRadius: 'var(--radius-md)' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              fontWeight: filter === 'all' ? 600 : 500,
              backgroundColor: filter === 'all' ? '#ffffff' : 'transparent',
              color: filter === 'all' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              boxShadow: filter === 'all' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            All Works ({paintings.length})
          </button>
          <button
            onClick={() => setFilter('available')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              fontWeight: filter === 'available' ? 600 : 500,
              backgroundColor: filter === 'available' ? '#ffffff' : 'transparent',
              color: filter === 'available' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              boxShadow: filter === 'available' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Available ({paintings.filter(p => p.status === 'available').length})
          </button>
          <button
            onClick={() => setFilter('sold')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              fontWeight: filter === 'sold' ? 600 : 500,
              backgroundColor: filter === 'sold' ? '#ffffff' : 'transparent',
              color: filter === 'sold' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              boxShadow: filter === 'sold' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Sold ({paintings.filter(p => p.status === 'sold').length})
          </button>
        </div>

        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Showing <strong>{filteredPaintings.length}</strong> artwork{filteredPaintings.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Loading, Error, and Empty States */}
      {loading && <LoadingSpinner message="Curating studio paintings..." />}

      {error && <ErrorMessage message={error} onRetry={loadPaintings} />}

      {!loading && !error && filteredPaintings.length === 0 && (
        <EmptyState
          icon={Palette}
          title="No paintings found"
          description={
            filter === 'available'
              ? 'All currently listed studio paintings have found a collector home.'
              : 'There are no paintings matching the selected criteria.'
          }
          action={
            filter !== 'all' ? (
              <button onClick={() => setFilter('all')} className="btn btn-secondary">
                View All Paintings
              </button>
            ) : null
          }
        />
      )}

      {/* Gallery Grid */}
      {!loading && !error && filteredPaintings.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '2rem'
        }}>
          {filteredPaintings.map((painting) => {
            const isAvailable = painting.status === 'available';

            return (
              <div key={painting.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Artwork Image Container */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '280px',
                  backgroundColor: '#e7e5e4',
                  overflow: 'hidden'
                }}>
                  <img
                    src={painting.image_url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80'}
                    alt={painting.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: isAvailable ? 'none' : 'grayscale(35%) opacity(0.85)',
                      transition: 'transform 0.3s ease'
                    }}
                  />
                  {/* Status Overlay Badge */}
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                    <StatusBadge status={painting.status} />
                  </div>
                </div>

                {/* Card Content */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <h3 className="serif-font" style={{ fontSize: '1.45rem', color: 'var(--color-text-main)', marginBottom: '0.2rem' }}>
                      {painting.title}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                      by <strong>{painting.artist}</strong>
                    </p>
                  </div>

                  <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.5,
                    marginBottom: '1.25rem',
                    flexGrow: 1
                  }}>
                    {painting.description}
                  </p>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--color-border)',
                    marginBottom: '1.25rem',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-subtle)'
                  }}>
                    <span>{painting.medium || 'Original Media'}</span>
                    <span>{painting.dimensions || 'Custom Size'}</span>
                  </div>

                  {/* Price and CTA */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase' }}>Price</span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        ₹{Number(painting.price).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {/* Customer / Guest Purchase Flow */}
                      {isAvailable && (
                        <>
                          {isCustomer ? (
                            <button
                              onClick={() => {
                                setPurchasingPainting(painting);
                                setPurchaseError('');
                                setPurchaseSuccess(null);
                              }}
                              className="btn btn-primary"
                              style={{ padding: '0.5rem 1rem' }}
                            >
                              <ShoppingBag size={16} /> Purchase
                            </button>
                          ) : isAdmin ? null : (
                            <button
                              onClick={onOpenAuth}
                              className="btn btn-outline"
                              style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
                            >
                              Sign In to Buy
                            </button>
                          )}
                        </>
                      )}

                      {!isAvailable && (
                        <div style={{
                          fontSize: '0.85rem',
                          color: 'var(--color-text-muted)',
                          padding: '0.4rem 0.75rem',
                          background: '#f5f5f4',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}>
                          <CheckCircle size={14} color="#15803d" /> Acquired
                        </div>
                      )}

                      {/* Admin Edit Action (Allowed ONLY while available) */}
                      {isAdmin && (
                        <button
                          onClick={() => openEditModal(painting)}
                          disabled={!isAvailable}
                          title={isAvailable ? 'Edit painting' : 'Cannot edit sold artwork'}
                          className="btn btn-secondary"
                          style={{ padding: '0.5rem 0.75rem' }}
                        >
                          <Edit size={16} /> {isAvailable ? 'Edit' : 'Sold'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Purchase Confirmation Modal */}
      {purchasingPainting && (
        <div className="modal-backdrop" onClick={() => !purchaseLoading && setPurchasingPainting(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 600 }}>Confirm Artwork Purchase</h3>
              <button
                disabled={purchaseLoading}
                onClick={() => setPurchasingPainting(null)}
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {purchaseSuccess ? (
                <div>
                  <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'var(--color-success-bg)',
                      color: 'var(--color-success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem auto'
                    }}>
                      <CheckCircle size={32} />
                    </div>
                    <h4 className="serif-font" style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Congratulations!</h4>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                      You are now the collector of <strong>"{purchasingPainting.title}"</strong>. An order has been placed.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                      <button
                        onClick={() => { setPurchasingPainting(null); onNavigateToOrders(); }}
                        className="btn btn-primary"
                      >
                        View in My Account
                      </button>
                      <button
                        onClick={() => setPurchasingPainting(null)}
                        className="btn btn-secondary"
                      >
                        Back to Gallery
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {purchaseError && (
                    <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                      <AlertCircle size={18} style={{ flexShrink: 0 }} />
                      <span>{purchaseError}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: '#faf9f6', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <img
                      src={purchasingPainting.image_url}
                      alt={purchasingPainting.title}
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                    />
                    <div>
                      <h4 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{purchasingPainting.title}</h4>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>{purchasingPainting.artist}</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        ₹{Number(purchasingPainting.price).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-info" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                    <span>
                      Each painting is unique. Per studio rules, you may cancel this order from your account dashboard at any time to release the painting back to the public collection.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      disabled={purchaseLoading}
                      onClick={() => setPurchasingPainting(null)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={purchaseLoading}
                      onClick={handlePurchase}
                      className="btn btn-primary"
                    >
                      {purchaseLoading ? 'Processing Order...' : 'Confirm Order'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Add / Edit Painting Modal */}
      {isFormOpen && (
        <div className="modal-backdrop" onClick={() => !formLoading && setIsFormOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 600 }}>
                {editingPainting ? 'Edit Painting Details' : 'Add New Studio Painting'}
              </h3>
              <button
                disabled={formLoading}
                onClick={() => setIsFormOpen(false)}
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ padding: '1.5rem' }}>
              {formError && (
                <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                  <span>{formError}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Celestial Twilight"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Artist *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.artist}
                    onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Price (₹ INR) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    className="form-input"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="8500"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Medium</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.medium}
                    onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                    placeholder="Oil on Canvas"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dimensions</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    placeholder='30" x 40"'
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows={3}
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the mood, technique, and inspirations..."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  disabled={formLoading}
                  onClick={() => setIsFormOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn btn-primary"
                >
                  {formLoading ? 'Saving...' : editingPainting ? 'Update Painting' : 'Add to Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
