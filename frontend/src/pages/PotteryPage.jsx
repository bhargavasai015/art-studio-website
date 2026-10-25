import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { Coffee, Calendar, Check, CheckCircle, AlertCircle, Sparkles, Info } from 'lucide-react';

export default function PotteryPage({ onOpenAuth, onNavigateToRequests }) {
  const { isAuthenticated, isCustomer, isAdmin } = useAuth();

  const [items, setItems] = useState([]);
  const [glazes, setGlazes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedGlazeId, setSelectedGlazeId] = useState(null);
  const [quantity, setQuantity] = useState(2);
  const [neededBy, setNeededBy] = useState('');
  const [notes, setNotes] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedRequest, setSubmittedRequest] = useState(null);

  // Compute minimum needed-by date: at least 14 days away
  const today = new Date();
  const minDateObj = new Date();
  minDateObj.setDate(today.getDate() + 14);
  const minDateStr = minDateObj.toISOString().split('T')[0];

  const loadCatalog = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/pottery/options');
      setItems(data.items || []);
      setGlazes(data.glazes || []);
      if (data.items?.length > 0) setSelectedItemId(data.items[0].id);
      if (data.glazes?.length > 0) setSelectedGlazeId(data.glazes[0].id);
    } catch (err) {
      setError(err.message || 'Failed to load pottery options catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const selectedItem = items.find((i) => i.id === selectedItemId);
  const selectedGlaze = glazes.find((g) => g.id === selectedGlazeId);

  const estimatedTotal = selectedItem ? (selectedItem.base_price * quantity) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }

    if (isAdmin) {
      setSubmitError('Studio admins cannot place pottery commission requests. Please use a customer account.');
      return;
    }

    if (!selectedItemId || !selectedGlazeId) {
      setSubmitError('Please select both a vessel shape and a glaze.');
      return;
    }

    setSubmitLoading(true);

    try {
      const data = await apiRequest('/pottery', {
        method: 'POST',
        body: {
          item_id: selectedItemId,
          glaze_id: selectedGlazeId,
          quantity: parseInt(quantity, 10),
          needed_by: neededBy,
          notes: notes.trim()
        }
      });

      setSubmittedRequest(data.request);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit custom pottery request.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 4rem 1.5rem' }}>
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
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
            <Sparkles size={14} /> Wheel-Thrown Artisanal Ceramics
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
            Request Custom Pottery
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Choose your ceramic silhouette and studio glaze formulation. Hand-thrown, trimmed, dried, bisque-fired, glazed, and final-fired to order.
          </p>
        </div>

        {loading && <LoadingSpinner message="Loading pottery shapes and studio glazes..." />}
        {error && <ErrorMessage message={error} onRetry={loadCatalog} />}

        {!loading && submittedRequest ? (
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
              Pottery Commission Requested!
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginBottom: '1.75rem' }}>
              Your custom ceramic request has been logged. Per studio rules, you may edit or cancel this request at any time while its status remains <strong>Requested</strong>.
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
                <span style={{ color: 'var(--color-text-muted)' }}>Vessel Shape:</span>
                <strong>{selectedItem?.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Glaze:</span>
                <strong>{selectedGlaze?.name} ({selectedGlaze?.finish})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Quantity:</span>
                <strong>{submittedRequest.quantity} unit(s)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Needed-By Date:</span>
                <strong>{submittedRequest.needed_by}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderTop: '1px solid var(--color-border)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>Estimated Cost:</span>
                <strong style={{ color: 'var(--color-primary)', fontSize: '1.15rem' }}>
                  ₹{Number(estimatedTotal).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={onNavigateToRequests}
                className="btn btn-primary"
              >
                View in My Account
              </button>
              <button
                onClick={() => {
                  setSubmittedRequest(null);
                  setNeededBy('');
                  setNotes('');
                }}
                className="btn btn-secondary"
              >
                Submit Another Request
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
                <strong>🏺 Vessel Selection:</strong>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>From studio catalog</p>
              </div>
              <div>
                <strong>🎨 Glaze Finish:</strong>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Hand-dipped & fired</p>
              </div>
              <div>
                <strong>🔢 Quantity Limit:</strong>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>1 to 12 pieces</p>
              </div>
              <div>
                <strong>⏳ Lead Time:</strong>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>At least 14 days away</p>
              </div>
            </div>

            {submitError && (
              <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Step 1: Vessel Shape Selection */}
              <div style={{ marginBottom: '2rem' }}>
                <label className="form-label" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
                  1. Choose Vessel Shape *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                  {items.map((item) => {
                    const isSelected = item.id === selectedItemId;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItemId(item.id)}
                        style={{
                          border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          backgroundColor: isSelected ? 'var(--color-primary-light)' : '#ffffff',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{item.name}</span>
                          <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.9rem' }}>
                            ₹{Number(item.base_price).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                          {item.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Glaze Selection */}
              <div style={{ marginBottom: '2rem' }}>
                <label className="form-label" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
                  2. Choose Studio Glaze *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  {glazes.map((glaze) => {
                    const isSelected = glaze.id === selectedGlazeId;
                    return (
                      <div
                        key={glaze.id}
                        onClick={() => setSelectedGlazeId(glaze.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          backgroundColor: isSelected ? 'var(--color-primary-light)' : '#ffffff',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.75rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: glaze.hex_code,
                          border: '2px solid #ffffff',
                          boxShadow: '0 0 0 1px #d6d3d1',
                          flexShrink: 0
                        }} />
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                            {glaze.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {glaze.finish}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Quantity & Needed-by Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">
                    Quantity (1 to 12) *
                  </label>
                  <select
                    className="form-select"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'piece' : 'pieces'}
                      </option>
                    ))}
                  </select>
                  <p className="form-help">Maximum 12 pieces per custom studio batch.</p>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Needed-By Date *</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>≥ 14 days</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={minDateStr}
                    className="form-input"
                    value={neededBy}
                    onChange={(e) => setNeededBy(e.target.value)}
                  />
                  <p className="form-help">Earliest delivery date: {minDateStr}</p>
                </div>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Custom Specifications / Notes (Optional)</label>
                <textarea
                  rows={3}
                  className="form-textarea"
                  placeholder="e.g., Slightly heavier base, satin sheen along the rim, custom stamped initials..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Estimated Total Bar */}
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
                    Estimated Commission Total
                  </span>
                  <div style={{ fontSize: '0.8rem', color: '#a16207', marginTop: '0.2rem' }}>
                    {quantity} × {selectedItem?.name} (₹{selectedItem?.base_price}/ea)
                  </div>
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#78350f' }}>
                  ₹{Number(estimatedTotal).toLocaleString('en-IN')}
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
                    Sign In as Customer to Request Pottery
                  </button>
                ) : isAdmin ? (
                  <div className="alert alert-info">
                    <Info size={18} />
                    <span>You are logged in as Studio Admin. Admins review and accept pottery requests in the Studio Admin panel.</span>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={submitLoading || !neededBy}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.85rem' }}
                  >
                    {submitLoading ? 'Submitting Request...' : 'Submit Pottery Commission Request'}
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
