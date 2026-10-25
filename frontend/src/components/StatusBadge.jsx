import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle, Sparkles } from 'lucide-react';

export default function StatusBadge({ status }) {
  if (!status) return null;

  const normalized = status.toLowerCase();

  switch (normalized) {
    case 'available':
      return (
        <span className="badge badge-available">
          <Sparkles size={12} /> Available
        </span>
      );
    case 'sold':
      return (
        <span className="badge badge-sold">
          <CheckCircle size={12} /> Sold
        </span>
      );
    case 'placed':
      return (
        <span className="badge badge-placed">
          <CheckCircle size={12} /> Placed
        </span>
      );
    case 'requested':
      return (
        <span className="badge badge-requested">
          <Clock size={12} /> Requested
        </span>
      );
    case 'confirmed':
      return (
        <span className="badge badge-confirmed">
          <CheckCircle size={12} /> Confirmed
        </span>
      );
    case 'accepted':
      return (
        <span className="badge badge-accepted">
          <CheckCircle size={12} /> Accepted
        </span>
      );
    case 'declined':
      return (
        <span className="badge badge-declined">
          <XCircle size={12} /> Declined
        </span>
      );
    case 'cancelled':
      return (
        <span className="badge badge-cancelled">
          <AlertCircle size={12} /> Cancelled
        </span>
      );
    default:
      return <span className="badge">{status}</span>;
  }
}
