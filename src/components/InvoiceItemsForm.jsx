import React from 'react';
import { LAPTOP_MODELS, SPECS_OPTIONS, DEAL_TYPES } from '../utils/constants';

const InvoiceItemsForm = ({
  items = [],
  onItemChange,
  onAddItem,
  onRemoveItem,
  onScanSerial
}) => {
  return (
    <div className="invoice-items-section">
      <div className="section-header-inline" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>Invoice Items</h3>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onAddItem}
          style={{ cursor: 'pointer' }}
        >
          + Add Item
        </button>
      </div>

      {items.map((item, index) => {
        const availableSpecs = SPECS_OPTIONS[item.laptopModel] || [];

        return (
          <div
            key={index}
            className="item-form-card"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '16px',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 600, color: '#6366f1' }}>Item #{index + 1}</span>
              {items.length > 1 && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => onRemoveItem(index)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              )}
            </div>

            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {/* Laptop Model */}
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#94a3b8' }}>Laptop Model *</label>
                <select
                  className="form-control"
                  value={item.laptopModel || ''}
                  onChange={(e) => {
                    onItemChange(index, 'laptopModel', e.target.value);
                    onItemChange(index, 'specs', ''); // Reset specs when model changes
                  }}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                >
                  <option value="">Select Model</option>
                  {LAPTOP_MODELS.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              {/* Specs */}
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#94a3b8' }}>Specifications *</label>
                <select
                  className="form-control"
                  value={item.specs || ''}
                  onChange={(e) => onItemChange(index, 'specs', e.target.value)}
                  disabled={!item.laptopModel}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                >
                  <option value="">Select Specs</option>
                  {availableSpecs.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              {/* Provider Deal Type */}
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#94a3b8' }}>Provider Deal *</label>
                <select
                  className="form-control"
                  value={item.dealType || DEAL_TYPES.COMMISSION}
                  onChange={(e) => onItemChange(index, 'dealType', e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                >
                  <option value={DEAL_TYPES.COMMISSION}>Commission (Fixed PKR 5,500)</option>
                  <option value={DEAL_TYPES.CHEAP_RATE}>Cheap Rate (Outright Purchase)</option>
                </select>
              </div>

              {/* Sale Price */}
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#94a3b8' }}>Sale Price (PKR) *</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 250000"
                  value={item.price || ''}
                  onChange={(e) => onItemChange(index, 'price', e.target.value)}
                  required
                  min="0"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                />
              </div>

              {/* Conditional Cost Price for Cheap Rate */}
              {item.dealType === DEAL_TYPES.CHEAP_RATE && (
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#fbbf24' }}>Cost Price from Provider (PKR) *</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 220000"
                    value={item.costPrice || ''}
                    onChange={(e) => onItemChange(index, 'costPrice', e.target.value)}
                    required
                    min="0"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1e293b', color: '#fbbf24', border: '1px solid #f59e0b' }}
                  />
                </div>
              )}

              {/* Serial Number & Camera OCR */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#94a3b8' }}>Serial Number</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Serial Number (e.g. C02...)"
                    value={item.serialNumber || ''}
                    onChange={(e) => onItemChange(index, 'serialNumber', e.target.value)}
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', background: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                  />
                  {onScanSerial && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onScanSerial(index)}
                      title="Scan Serial Number using Camera"
                      style={{
                        padding: '8px 12px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      📷 Scan OCR
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InvoiceItemsForm;
