import { useState } from 'react';
import type { CompanyInfo } from '../../types/retailDaddy';

interface CompanyMasterModalProps {
  isOpen: boolean;
  companyInfo: CompanyInfo;
  onSave: (updated: CompanyInfo) => void;
  onClose: () => void;
}

export function CompanyMasterModal({ isOpen, companyInfo, onSave, onClose }: CompanyMasterModalProps) {
  const [formData, setFormData] = useState<CompanyInfo>({ ...companyInfo });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // GSTIN format checker (15 alphanumeric characters: 2 state digits + 10 PAN + 1 entity + Z + 1 checksum)
  const isGstinValid = (gst: string) => {
    if (!gst) return false;
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return regex.test(gst.trim().toUpperCase());
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Company Name is required!');
      return;
    }
    onSave(formData);
    showToast('✅ Company Master Saved Successfully!');
    setTimeout(() => onClose(), 600);
  };

  const handleReset = () => {
    setFormData({
      ...companyInfo,
      name: 'SHREE VINAYAKA FURNITURES',
      address: 'Bypass Road, Near Shiva Temple, Vaikom',
      city: 'Kottayam',
      state: 'Kerala',
      contactNo: '+91 98470 12345',
      email: 'vinayakafurnitures@gmail.com',
      gstin: '32AAAAA0000A1Z5',
      currencySymbol: '₹',
      loyaltyPerPointValue: 0.10
    });
    showToast('Reset to system defaults');
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(formData.companyId);
    showToast('📋 Company ID Copied to Clipboard!');
  };

  return (
    <div className="rd-modal-overlay">
      <div className="rd-dialog" style={{ width: '840px', maxWidth: '95vw' }}>
        {/* TITLEBAR (FRAME 240) */}
        <div className="rd-dialog-titlebar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Company Master</span>
            <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '3px' }}>
              Master Entry
            </span>
          </div>
          <button
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* TOAST NOTIFICATION */}
        {toastMessage && (
          <div style={{
            background: '#15803d',
            color: '#fff',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            {toastMessage}
          </div>
        )}

        <div className="rd-dialog-body" style={{ maxHeight: '560px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            {/* LEFT FORM FIELDS */}
            <div style={{ flex: 1.3 }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '8px', borderBottom: '2px solid #3b82f6', paddingBottom: '3px' }}>
                Company Info
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                  Company Name :
                </label>
                <input
                  type="text"
                  className="rd-cell-input"
                  style={{ width: '100%', background: '#fef08a', fontWeight: 'bold' }}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  placeholder="e.g. SHREE VINAYAKA FURNITURES"
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                  Address :
                </label>
                <textarea
                  className="rd-cell-input"
                  style={{ width: '100%', height: '55px', background: '#fef08a' }}
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, Landmark, Locality"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                    City :
                  </label>
                  <input
                    type="text"
                    className="rd-cell-input"
                    style={{ width: '100%', background: '#fef08a' }}
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                    State :
                  </label>
                  <select
                    className="rd-cell-input"
                    style={{ width: '100%' }}
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                  >
                    <option value="Kerala">Kerala (Code: 32)</option>
                    <option value="Karnataka">Karnataka (Code: 29)</option>
                    <option value="Tamil Nadu">Tamil Nadu (Code: 33)</option>
                    <option value="Maharashtra">Maharashtra (Code: 27)</option>
                    <option value="Delhi">Delhi (Code: 07)</option>
                    <option value="Andhra Pradesh">Andhra Pradesh (Code: 37)</option>
                    <option value="Telangana">Telangana (Code: 36)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                    Contact No :
                  </label>
                  <input
                    type="text"
                    className="rd-cell-input"
                    style={{ width: '100%', background: '#fef08a' }}
                    value={formData.contactNo}
                    onChange={e => setFormData({ ...formData, contactNo: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                    Email ID :
                  </label>
                  <input
                    type="email"
                    className="rd-cell-input"
                    style={{ width: '100%', background: '#fef08a' }}
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                    GSTIN :
                  </label>
                  {formData.gstin && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: isGstinValid(formData.gstin) ? '#16a34a' : '#dc2626'
                    }}>
                      {isGstinValid(formData.gstin) ? '✓ Valid GSTIN' : '⚠ Invalid GSTIN! (15 chars format)'}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  className="rd-cell-input"
                  style={{
                    width: '100%',
                    background: '#fef08a',
                    fontWeight: 'bold',
                    borderColor: formData.gstin ? (isGstinValid(formData.gstin) ? '#16a34a' : '#dc2626') : undefined
                  }}
                  value={formData.gstin}
                  onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  placeholder="e.g. 32AAAAA0000A1Z5"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                    CIN :
                  </label>
                  <input
                    type="text"
                    className="rd-cell-input"
                    style={{ width: '100%' }}
                    value={formData.cin || ''}
                    onChange={e => setFormData({ ...formData, cin: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                    Website :
                  </label>
                  <input
                    type="text"
                    className="rd-cell-input"
                    style={{ width: '100%' }}
                    value={formData.website || ''}
                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
              </div>

              {/* BANK DETAILS (FRAME 240) */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px', marginTop: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                  Bank Details (Reflected on Invoices)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '9px', fontWeight: 'bold' }}>Account Name:</label>
                    <input
                      type="text"
                      className="rd-cell-input"
                      value={formData.accountName || ''}
                      onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '9px', fontWeight: 'bold' }}>Account No:</label>
                    <input
                      type="text"
                      className="rd-cell-input"
                      value={formData.accountNo || ''}
                      onChange={e => setFormData({ ...formData, accountNo: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '9px', fontWeight: 'bold' }}>Bank & Branch:</label>
                    <input
                      type="text"
                      className="rd-cell-input"
                      value={formData.branch || ''}
                      onChange={e => setFormData({ ...formData, branch: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '9px', fontWeight: 'bold' }}>IFSC Code:</label>
                    <input
                      type="text"
                      className="rd-cell-input"
                      value={formData.ifsc || ''}
                      onChange={e => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Loyalty Per Point Value :</span>
                <input
                  type="number"
                  step="0.01"
                  className="rd-cell-input"
                  style={{ width: '80px', textAlign: 'center' }}
                  value={formData.loyaltyPerPointValue}
                  onChange={e => setFormData({ ...formData, loyaltyPerPointValue: Number(e.target.value) || 0.1 })}
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>₹ per point</span>
              </div>
            </div>

            {/* RIGHT SIDE: LOGO & BUTTONS & CLOUD APP */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* LOGO BOX (FRAME 240) */}
              <div>
                <div style={{
                  width: '100%',
                  height: '110px',
                  background: '#f1f5f9',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  overflow: 'hidden'
                }}>
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo" style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span>NO LOGO AVAILABLE</span>
                  )}
                </div>
                <div style={{ marginTop: '4px', display: 'flex', gap: '6px' }}>
                  <button
                    className="rd-grid-btn"
                    style={{ flex: 1, background: '#e0f2fe', color: '#0369a1' }}
                    onClick={() => {
                      const sample = 'https://api.iconify.design/lucide:armchair.svg?color=%2316a34a';
                      setFormData({ ...formData, logo: sample });
                      showToast('Brand Logo Attached');
                    }}
                  >
                    Browse...
                  </button>
                  {formData.logo && (
                    <button
                      className="rd-grid-btn"
                      style={{ background: '#fee2e2', color: '#dc2626' }}
                      onClick={() => setFormData({ ...formData, logo: '' })}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* ACTION BUTTONS (FRAME 240) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  className="rd-grid-btn"
                  style={{ background: '#16a34a', color: '#fff', fontWeight: '900', padding: '8px', fontSize: '13px' }}
                  onClick={handleSave}
                >
                  💾 Save
                </button>
                <button
                  className="rd-grid-btn"
                  style={{ background: '#dc2626', color: '#fff', fontWeight: 'bold', padding: '6px' }}
                  onClick={handleReset}
                >
                  🔄 Reset
                </button>
                <button
                  className="rd-grid-btn"
                  style={{ background: '#2563eb', color: '#fff', fontWeight: 'bold', padding: '6px' }}
                  onClick={() => showToast('Printing Official Store Envelope...')}
                >
                  ✉️ Envelope Print
                </button>
              </div>

              {/* CURRENCY & BARCODE CODE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>
                    Currency Symbol :
                  </label>
                  <input
                    type="text"
                    className="rd-cell-input"
                    style={{ textAlign: 'center', fontWeight: 'bold' }}
                    value={formData.currencySymbol}
                    onChange={e => setFormData({ ...formData, currencySymbol: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>
                    Barcode Code :
                  </label>
                  <input
                    type="text"
                    className="rd-cell-input"
                    style={{ textAlign: 'center' }}
                    value={formData.barcodeCode || 'SVF'}
                    onChange={e => setFormData({ ...formData, barcodeCode: e.target.value })}
                  />
                </div>
              </div>

              {/* COMPANY ID WITH COPY */}
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>
                  Company ID :
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    className="rd-cell-input"
                    readOnly
                    style={{ flex: 1, fontSize: '10px', background: '#e2e8f0' }}
                    value={formData.companyId}
                  />
                  <button
                    className="rd-grid-btn"
                    style={{ background: '#0f172a', color: '#fff', fontSize: '10px' }}
                    onClick={handleCopyId}
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* MOBILE ANDROID APP AND MULTI BRANCH STATUS (FRAME 240) */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#0f172a', marginBottom: '6px' }}>
                  Mobile Android App & Multi Branch Status :
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=https://srivinayakafurnitures.pages.dev"
                    alt="Branch QR"
                    style={{ width: '60px', height: '60px', border: '1px solid #e2e8f0' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '18px' }}>🤖</span>
                      <select
                        className="rd-cell-input"
                        style={{ flex: 1, fontSize: '11px' }}
                        value={formData.multiBranchEnabled ? 'Active' : 'Disabled'}
                        onChange={e => setFormData({ ...formData, multiBranchEnabled: e.target.value === 'Active' })}
                      >
                        <option value="Disabled">Disabled</option>
                        <option value="Active">Active (Multi-Counter)</option>
                      </select>
                    </div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>
                      Terminal Sync ID: RD-VAIKOM-COUNTER1
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '8px 16px', background: '#f1f5f9', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="rd-grid-btn" onClick={onClose}>
            Close
          </button>
          <button
            className="rd-grid-btn"
            style={{ background: '#16a34a', color: '#fff', fontWeight: 'bold', padding: '6px 16px' }}
            onClick={handleSave}
          >
            💾 Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
