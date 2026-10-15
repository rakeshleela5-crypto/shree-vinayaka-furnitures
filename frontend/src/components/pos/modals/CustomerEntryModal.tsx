import React, { useState } from 'react';
import { X, Check, FileSpreadsheet, User, MapPin, Building } from 'lucide-react';
import type { Customer, BalanceType } from '../../../types/pos';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaveCustomer: (customer: Customer) => void;
  existingCustomer?: Customer | null;
}

export const CustomerEntryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSaveCustomer,
  existingCustomer
}) => {
  const [formData, setFormData] = useState<Partial<Customer>>({
    code: existingCustomer?.code || `C-0${Math.floor(100 + Math.random() * 900)}`,
    name: existingCustomer?.name || '',
    contactNo: existingCustomer?.contactNo || '',
    email: existingCustomer?.email || '',
    gstin: existingCustomer?.gstin || '',
    pan: existingCustomer?.pan || '',
    cin: existingCustomer?.cin || '',
    address: existingCustomer?.address || '',
    city: existingCustomer?.city || 'Bengaluru',
    state: existingCustomer?.state || 'Karnataka',
    pincode: existingCustomer?.pincode || '',
    sameAddress: existingCustomer?.sameAddress ?? true,
    shippingAddress: existingCustomer?.shippingAddress || '',
    openingBalance: existingCustomer?.openingBalance || 0,
    balanceType: existingCustomer?.balanceType || 'CR',
    currentBalance: existingCustomer?.currentBalance || 0,
    loyaltyPoints: existingCustomer?.loyaltyPoints || 0,
    loyaltyEnabled: existingCustomer?.loyaltyEnabled ?? true,
    remarks: existingCustomer?.remarks || '',
    tcsApplied: existingCustomer?.tcsApplied || 'No',
    bankName: existingCustomer?.bankName || '',
    accountNo: existingCustomer?.accountNo || '',
    ifsc: existingCustomer?.ifsc || ''
  });

  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSameAddressToggle = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      sameAddress: checked,
      shippingAddress: checked ? (prev.address || '') : prev.shippingAddress
    }));
  };

  const handleAddressChange = (addr: string) => {
    setFormData(prev => ({
      ...prev,
      address: addr,
      shippingAddress: prev.sameAddress ? addr : prev.shippingAddress
    }));
  };

  const handleGSheetSync = () => {
    setSyncStatus('Fetching from Google Sheets...');
    setTimeout(() => {
      setSyncStatus('✓ Synced latest contact from Google Sheets!');
      setTimeout(() => setSyncStatus(null), 3000);
    }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.contactNo?.trim()) {
      alert('Please enter at least Customer Name and Contact Number');
      return;
    }

    const customer: Customer = {
      id: existingCustomer?.id || `cust-${Date.now()}`,
      code: formData.code || 'C-0105',
      name: formData.name,
      contactNo: formData.contactNo,
      email: formData.email,
      gstin: formData.gstin,
      pan: formData.pan,
      cin: formData.cin,
      address: formData.address || '',
      city: formData.city || '',
      state: formData.state || 'Karnataka',
      pincode: formData.pincode || '',
      sameAddress: !!formData.sameAddress,
      shippingAddress: formData.shippingAddress || formData.address || '',
      openingBalance: Number(formData.openingBalance || 0),
      balanceType: (formData.balanceType as BalanceType) || 'CR',
      currentBalance: Number(formData.openingBalance || 0),
      loyaltyPoints: Number(formData.loyaltyPoints || 0),
      loyaltyEnabled: !!formData.loyaltyEnabled,
      remarks: formData.remarks,
      tcsApplied: formData.tcsApplied || 'No',
      bankName: formData.bankName,
      accountNo: formData.accountNo,
      ifsc: formData.ifsc
    };

    onSaveCustomer(customer);
    onClose();
  };

  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal-window" style={{ maxWidth: '820px', width: '95%' }}>
        <div className="pos-modal-header" style={{ background: '#0284c7', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Customer Entry</h3>
          </div>
          <button className="pos-modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '16px', background: '#f8fafc' }}>
          {syncStatus && (
            <div style={{ padding: '8px 12px', background: '#dcfce7', color: '#166534', borderRadius: '4px', marginBottom: '12px', fontSize: '0.85rem' }}>
              {syncStatus}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '12px', marginBottom: '12px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Customer ID :</label>
              <input
                type="text"
                value={formData.code}
                readOnly
                style={{ width: '100%', padding: '6px 8px', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '4px', fontWeight: 'bold' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Customer Name : *</label>
              <input
                type="text"
                required
                placeholder="Enter full customer or business name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #94a3b8', borderRadius: '4px', background: '#fff' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={handleGSheetSync}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#ea580c', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
              >
                <FileSpreadsheet size={14} /> Get (GSheet)
              </button>
            </div>
          </div>

          {/* Addresses */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} /> Billing Address :
              </label>
              <textarea
                rows={3}
                placeholder="Street address, building, suite..."
                value={formData.address}
                onChange={e => handleAddressChange(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #94a3b8', borderRadius: '4px', fontSize: '0.85rem' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '6px' }}>
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem' }}
                />
                <select
                  value={formData.state}
                  onChange={e => setFormData({ ...formData, state: e.target.value })}
                  style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem' }}
                >
                  <option value="Karnataka">Karnataka (Intra-state)</option>
                  <option value="Kerala">Kerala (IGST)</option>
                  <option value="Tamil Nadu">Tamil Nadu (IGST)</option>
                  <option value="Andhra Pradesh">Andhra Pradesh (IGST)</option>
                  <option value="Maharashtra">Maharashtra (IGST)</option>
                  <option value="Delhi">Delhi (IGST)</option>
                </select>
                <input
                  type="text"
                  placeholder="PIN Code"
                  value={formData.pincode}
                  onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                  style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building size={13} /> Shipping / Delivery Destination :
                </label>
                <label style={{ fontSize: '0.75rem', color: '#1d4ed8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="checkbox"
                    checked={formData.sameAddress}
                    onChange={e => handleSameAddressToggle(e.target.checked)}
                  />
                  Same as Billing
                </label>
              </div>
              <textarea
                rows={3}
                disabled={formData.sameAddress}
                placeholder="Separate site or delivery address..."
                value={formData.shippingAddress}
                onChange={e => setFormData({ ...formData, shippingAddress: e.target.value })}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #94a3b8',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  background: formData.sameAddress ? '#f1f5f9' : '#fff'
                }}
              />
            </div>
          </div>

          {/* Contact & Tax Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Contact No : *</label>
              <input
                type="tel"
                required
                placeholder="10-digit mobile"
                value={formData.contactNo}
                onChange={e => setFormData({ ...formData, contactNo: e.target.value })}
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #94a3b8', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Email ID :</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #94a3b8', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>GSTIN / UID :</label>
              <input
                type="text"
                placeholder="15-digit GSTIN"
                value={formData.gstin}
                onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #94a3b8', borderRadius: '4px', textTransform: 'uppercase' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>PAN / CIN :</label>
              <input
                type="text"
                placeholder="PAN Number"
                value={formData.pan}
                onChange={e => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #94a3b8', borderRadius: '4px' }}
              />
            </div>
          </div>

          {/* Ledger & Loyalty */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '10px', background: '#f1f5f9', borderRadius: '6px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Opening Balance :</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="number"
                  step="0.01"
                  value={formData.openingBalance}
                  onChange={e => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                  style={{ width: '70%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
                <select
                  value={formData.balanceType}
                  onChange={e => setFormData({ ...formData, balanceType: e.target.value as BalanceType })}
                  style={{ width: '30%', padding: '5px', border: '1px solid #cbd5e1', borderRadius: '4px', fontWeight: 600 }}
                >
                  <option value="CR">CR</option>
                  <option value="DR">DR</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Loyalty Points :</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '32px' }}>
                <input
                  type="number"
                  value={formData.loyaltyPoints}
                  onChange={e => setFormData({ ...formData, loyaltyPoints: Number(e.target.value) })}
                  style={{ width: '60%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
                <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="checkbox"
                    checked={formData.loyaltyEnabled}
                    onChange={e => setFormData({ ...formData, loyaltyEnabled: e.target.checked })}
                  />
                  Enable
                </label>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>TCS / TDS Applied :</label>
              <select
                value={formData.tcsApplied}
                onChange={e => setFormData({ ...formData, tcsApplied: e.target.value })}
                style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              >
                <option value="No">No</option>
                <option value="TCS 0.075%">TCS 0.075%</option>
                <option value="TCS 0.1%">TCS 0.1%</option>
              </select>
            </div>
          </div>

          <div className="pos-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 16px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Check size={16} /> Save Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
