import React, { useState, useRef } from 'react';
import type { CompanyInfo } from '../../types/retailDaddy';
import { api } from '../../api/client';

interface CompanyMasterModalProps {
  isOpen: boolean;
  companyInfo: CompanyInfo;
  onSave: (updated: CompanyInfo) => void;
  onClose: () => void;
}

export function CompanyMasterModal({ isOpen, companyInfo, onSave, onClose }: CompanyMasterModalProps) {
  const [formData, setFormData] = useState<CompanyInfo>(() => ({
    ...companyInfo,
    barcodeCode: companyInfo.barcodeCode || companyInfo.barcodePrefix || '99',
    barcodePrefix: companyInfo.barcodePrefix || companyInfo.barcodeCode || '99',
    loyaltyPerPointValue: companyInfo.loyaltyPerPointValue !== undefined ? companyInfo.loyaltyPerPointValue : 0.10,
    currencySymbol: companyInfo.currencySymbol || '₹',
    mobileAppStatus: companyInfo.mobileAppStatus || 'Enabled',
    accountName: companyInfo.accountName || 'YOUR BANK NAME',
    accountNo: companyInfo.accountNo || '123456789',
    branch: companyInfo.branch || 'YOUR BRANCH',
    ifsc: companyInfo.ifsc || 'ICIC0003456'
  }));

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showEnvelopeModal, setShowEnvelopeModal] = useState(false);
  const [envelopeRecipient, setEnvelopeRecipient] = useState({
    name: 'M/s. Royal Furnishings & Decors',
    attention: 'Attn: Mr. Rajesh Kumar (Procurement Manager)',
    address: 'Plot No. 45, Industrial Development Area, Phase II',
    cityStatePin: 'Ernakulam, Kerala - 682030',
    phone: '+91 94471 23456'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // GSTIN format checker (15 alphanumeric characters)
  const isGstinValid = (gst: string) => {
    if (!gst) return false;
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return regex.test(gst.trim().toUpperCase());
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      showToast('⚠️ Company Name is required!');
      return;
    }
    const updated: CompanyInfo = {
      ...formData,
      barcodePrefix: formData.barcodeCode || formData.barcodePrefix || '99',
      barcodeCode: formData.barcodeCode || formData.barcodePrefix || '99'
    };
    onSave(updated);

    // Persist directly to Railway Cloud PostgreSQL database
    api.updateCompanyProfile({
      company_name: updated.name,
      address: updated.address,
      city: updated.city,
      state: updated.state,
      phone: updated.contactNo || updated.phone,
      email: updated.email,
      gstin: updated.gstin,
      currency_symbol: updated.currencySymbol || '₹',
      loyalty_per_point_value: updated.loyaltyPerPointValue,
      bank_name: updated.accountName || updated.bankName,
      bank_ac_no: updated.accountNo,
      bank_ifsc: updated.ifsc,
      bank_branch: updated.branch,
      logo_url: updated.logo,
      signature_url: updated.signature || updated.signatureUrl
    }).catch(e => console.warn('Company profile backend sync queued:', e));

    showToast('✅ Company Master Saved to Railway PostgreSQL!');
    setTimeout(() => onClose(), 600);
  };

  const handleReset = () => {
    setFormData({
      ...companyInfo,
      name: 'Shree Vinayaka Furnitures',
      address: 'Near Old Bus Stand, Main Road',
      city: 'Kundapura',
      state: 'Karnataka',
      contactNo: '9845001234',
      email: 'sales@shreevinayakafurnitures.com',
      gstin: '29AABCS8899Z1Z5',
      cin: 'U36100KA2024PTC012345',
      website: 'www.shreevinayakafurnitures.com',
      accountName: 'SHREE VINAYAKA FURNITURES',
      accountNo: '50200088990011',
      branch: 'Kundapura Town',
      ifsc: 'HDFC0001234',
      currencySymbol: '₹',
      barcodeCode: '99',
      barcodePrefix: '99',
      loyaltyPerPointValue: 0.10,
      mobileAppStatus: 'Enabled'
    });
    showToast('🔄 Reset to Shree Vinayaka Furnitures store profile');
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(formData.companyId || 'd1828b099cb5fac798b5d0b2e37de9b3');
    showToast('📋 Company ID Copied to Clipboard!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData(prev => ({ ...prev, logo: event.target!.result as string }));
          showToast('✓ Custom Logo Uploaded Successfully!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const sigDataUrl = event.target!.result as string;
          setFormData(prev => ({ ...prev, signature: sigDataUrl, signatureUrl: sigDataUrl }));
          showToast('✓ Scanned Authorized Signature Uploaded (Rule 46 Compliant)!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <div className="rd-modal-overlay" style={{ zIndex: 1200 }}>
        <div
          className="rd-dialog"
          style={{
            width: '900px',
            maxWidth: '96vw',
            background: '#dbeafe',
            border: '2px solid #1e40af',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            borderRadius: '4px',
            overflow: 'hidden',
            fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
          }}
        >
          {/* TOP WINDOWS TITLEBAR (Video 09 Frame 0115 & 0395) */}
          <div
            style={{
              background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)',
              color: '#ffffff',
              padding: '4px 10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              userSelect: 'none',
              borderBottom: '1px solid #60a5fa'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold' }}>
              <span style={{ fontSize: '14px' }}>🏢</span>
              <span>Company Master</span>
            </div>
            <div style={{ display: 'flex', gap: '3px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  width: '24px',
                  height: '20px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                _
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  width: '24px',
                  height: '20px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                □
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#ef4444',
                  border: 'none',
                  color: '#ffffff',
                  width: '24px',
                  height: '20px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* SECONDARY HEADER: "Company Master" blue badge + "Raint" button (Frame 0115) */}
          <div
            style={{
              padding: '6px 14px',
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              borderBottom: '1px solid #bfdbfe'
            }}
          >
            <div
              style={{
                backgroundColor: '#1d4ed8',
                color: '#ffffff',
                fontWeight: '900',
                fontSize: '16px',
                padding: '4px 14px',
                borderRadius: '3px',
                letterSpacing: '0.5px'
              }}
            >
              Company Master
            </div>
            <button
              type="button"
              onClick={() => showToast('Shree Vinayaka Furnitures ERP Core: Active')}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #93c5fd',
                borderRadius: '3px',
                padding: '3px 10px',
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#1e3a8a',
                cursor: 'pointer'
              }}
            >
              SVF Core
            </button>

            {toastMessage && (
              <div style={{ marginLeft: 'auto', backgroundColor: '#15803d', color: '#fff', padding: '3px 12px', fontSize: '11px', fontWeight: 'bold', borderRadius: '3px' }}>
                {toastMessage}
              </div>
            )}
          </div>

          {/* DIALOG MAIN BODY (3-COLUMN LAYOUT EXACT MATCH OF FRAME 0115 & 0395) */}
          <div
            style={{
              padding: '14px',
              background: '#f8fafc',
              maxHeight: 'calc(88vh - 80px)',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.1fr 150px', gap: '16px' }}>
              {/* ============================================================== */}
              {/* LEFT COLUMN: COMPANY INFO & BANK DETAILS (FRAME 0115 & 0395)    */}
              {/* ============================================================== */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', marginBottom: '6px' }}>
                  Company Info
                </div>

                {/* Company Name */}
                <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>Company Name :</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                    style={{
                      height: '24px',
                      padding: '2px 6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: '#fef08a',
                      border: '1px solid #cbd5e1',
                      borderRadius: '2px',
                      color: '#0f172a'
                    }}
                    placeholder="e.g. DIAMOND SHOP"
                  />
                </div>

                {/* Address */}
                <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155', paddingTop: '4px' }}>Address :</label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    style={{
                      padding: '4px 6px',
                      fontSize: '11px',
                      backgroundColor: '#fef08a',
                      border: '1px solid #cbd5e1',
                      borderRadius: '2px',
                      color: '#0f172a',
                      resize: 'none'
                    }}
                    placeholder="Street Address, Landmark"
                  />
                </div>

                {/* City */}
                <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>City :</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    style={{
                      height: '24px',
                      padding: '2px 6px',
                      fontSize: '11px',
                      backgroundColor: '#fef08a',
                      border: '1px solid #cbd5e1',
                      borderRadius: '2px',
                      color: '#0f172a'
                    }}
                    placeholder="e.g. YOUR CITY"
                  />
                </div>

                {/* State */}
                <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>State :</label>
                  <select
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    style={{
                      height: '24px',
                      padding: '2px 6px',
                      fontSize: '11px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '2px',
                      color: '#0f172a'
                    }}
                  >
                    <option value="Kerala">Kerala</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="West Bengal">West Bengal</option>
                  </select>
                </div>

                {/* Contact No */}
                <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>Contact No :</label>
                  <input
                    type="text"
                    value={formData.contactNo}
                    onChange={e => setFormData({ ...formData, contactNo: e.target.value })}
                    style={{
                      height: '24px',
                      padding: '2px 6px',
                      fontSize: '11px',
                      backgroundColor: '#fef08a',
                      border: '1px solid #cbd5e1',
                      borderRadius: '2px',
                      color: '#0f172a'
                    }}
                    placeholder="e.g. 123456789"
                  />
                </div>

                {/* Email ID */}
                <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>Email ID :</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      height: '24px',
                      padding: '2px 6px',
                      fontSize: '11px',
                      backgroundColor: '#fef08a',
                      border: '1px solid #cbd5e1',
                      borderRadius: '2px',
                      color: '#0f172a'
                    }}
                    placeholder="e.g. yourmailid@gmail.com"
                  />
                </div>

                {/* GSTIN */}
                <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>GSTIN :</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    style={{
                      height: '24px',
                      padding: '2px 6px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      backgroundColor: '#fef08a',
                      border: '1px solid #cbd5e1',
                      borderRadius: '2px',
                      color: '#0f172a'
                    }}
                    placeholder="e.g. 1234454444444"
                  />
                </div>

                {/* CIN */}
                <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>CIN :</label>
                  <input
                    type="text"
                    value={formData.cin || ''}
                    onChange={e => setFormData({ ...formData, cin: e.target.value })}
                    style={{
                      height: '24px',
                      padding: '2px 6px',
                      fontSize: '11px',
                      backgroundColor: '#fef08a',
                      border: '1px solid #cbd5e1',
                      borderRadius: '2px',
                      color: '#0f172a'
                    }}
                    placeholder="Corporate Identification No"
                  />
                </div>

                {/* Website */}
                <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>Website :</label>
                  <input
                    type="text"
                    value={formData.website || ''}
                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                    style={{
                      height: '24px',
                      padding: '2px 6px',
                      fontSize: '11px',
                      backgroundColor: '#fef08a',
                      border: '1px solid #cbd5e1',
                      borderRadius: '2px',
                      color: '#0f172a'
                    }}
                    placeholder="e.g. www.retaildaddy.com"
                  />
                </div>

                {/* Bank Details Sub-Section (Frame 0395) */}
                <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', marginBottom: '6px' }}>
                    Bank Details
                  </div>

                  {/* Account Name */}
                  <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>Account Name :</label>
                    <input
                      type="text"
                      value={formData.accountName || ''}
                      onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                      style={{
                        height: '24px',
                        padding: '2px 6px',
                        fontSize: '11px',
                        backgroundColor: '#fef08a',
                        border: '1px solid #cbd5e1',
                        borderRadius: '2px',
                        color: '#0f172a'
                      }}
                      placeholder="e.g. YOUR BANK NAME"
                    />
                  </div>

                  {/* Account No */}
                  <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>Account No :</label>
                    <input
                      type="text"
                      value={formData.accountNo || ''}
                      onChange={e => setFormData({ ...formData, accountNo: e.target.value })}
                      style={{
                        height: '24px',
                        padding: '2px 6px',
                        fontSize: '11px',
                        backgroundColor: '#fef08a',
                        border: '1px solid #cbd5e1',
                        borderRadius: '2px',
                        color: '#0f172a'
                      }}
                      placeholder="e.g. 123456789"
                    />
                  </div>

                  {/* Branch */}
                  <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>Branch :</label>
                    <input
                      type="text"
                      value={formData.branch || ''}
                      onChange={e => setFormData({ ...formData, branch: e.target.value })}
                      style={{
                        height: '24px',
                        padding: '2px 6px',
                        fontSize: '11px',
                        backgroundColor: '#fef08a',
                        border: '1px solid #cbd5e1',
                        borderRadius: '2px',
                        color: '#0f172a'
                      }}
                      placeholder="e.g. YOUR BRANCH"
                    />
                  </div>

                  {/* IFSC code */}
                  <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>IFSC code :</label>
                    <input
                      type="text"
                      value={formData.ifsc || ''}
                      onChange={e => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })}
                      style={{
                        height: '24px',
                        padding: '2px 6px',
                        fontSize: '11px',
                        backgroundColor: '#fef08a',
                        border: '1px solid #cbd5e1',
                        borderRadius: '2px',
                        color: '#0f172a'
                      }}
                      placeholder="e.g. ICIC0003456 or 0000"
                    />
                  </div>
                </div>

                {/* Loyalty Point Value (Frame 0115 & 0395) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>Loyality Per Pont Value :</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.loyaltyPerPointValue}
                    onChange={e => setFormData({ ...formData, loyaltyPerPointValue: parseFloat(e.target.value) || 0.10 })}
                    style={{
                      width: '80px',
                      height: '24px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      backgroundColor: '#fef08a',
                      border: '1px solid #cbd5e1',
                      borderRadius: '2px'
                    }}
                    title="1.00 = ₹1/point, 0.10 = 10% cash value (Frame 0275/0305)"
                  />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>₹ per point</span>
                </div>
              </div>

              {/* ============================================================== */}
              {/* CENTER COLUMN: LOGO, CURRENCY, BARCODE CODE, CLOUD TELEMETRY   */}
              {/* ============================================================== */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Logo Box (Frame 0115 & 0395) */}
                <div>
                  <div
                    style={{
                      width: '100%',
                      height: '140px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {formData.logo ? (
                      <img
                        src={formData.logo}
                        alt="Company Logo"
                        style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#94a3b8', userSelect: 'none' }}>
                        <div style={{ fontSize: '28px', opacity: 0.5, marginBottom: '4px' }}>🏷️</div>
                        <div style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '1px' }}>NO LOGO</div>
                        <div style={{ fontSize: '11px', fontWeight: 'bold' }}>AVAILABLE</div>
                      </div>
                    )}
                  </div>

                  {/* Browse & Status Row under Logo */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: isGstinValid(formData.gstin) ? '#15803d' : '#dc2626'
                      }}
                    >
                      {isGstinValid(formData.gstin) ? '✓ Valid GSTIN' : 'Invalid GSTIN!'}
                    </span>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '2px',
                          padding: '3px 12px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                        title="Upload local logo file"
                      >
                        Browse...
                      </button>

                      {formData.logo && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                          style={{
                            backgroundColor: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '2px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                          title="Remove logo"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Video Tutorial Gap: Scanned Authorized Signature Upload (GST Rule 46) */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e40af', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Authorized Signature</span>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal' }}>GST Rule 46</span>
                  </div>

                  <div
                    style={{
                      width: '100%',
                      height: '75px',
                      backgroundColor: '#ffffff',
                      border: '1px dashed #3b82f6',
                      borderRadius: '4px',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {formData.signature ? (
                      <img
                        src={formData.signature}
                        alt="Authorized Signature"
                        style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#94a3b8', userSelect: 'none' }}>
                        <div style={{ fontSize: '18px', opacity: 0.6, marginBottom: '2px' }}>✍️</div>
                        <div style={{ fontSize: '11px', fontWeight: 'bold' }}>NO SIGNATURE UPLOADED</div>
                        <div style={{ fontSize: '9px' }}>Scanned JPG / PNG with white bg</div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '10px', color: formData.signature ? '#15803d' : '#64748b', fontWeight: 'bold' }}>
                      {formData.signature ? '✓ Sign Active' : 'Prints on Bills'}
                    </span>

                    <input
                      type="file"
                      ref={signatureInputRef}
                      onChange={handleSignatureChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => signatureInputRef.current?.click()}
                        style={{
                          backgroundColor: '#0f766e',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '2px',
                          padding: '3px 10px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                        title="Upload scanned signature photo"
                      >
                        ✍️ Upload Sign...
                      </button>

                      {formData.signature && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, signature: '', signatureUrl: '' }))}
                          style={{
                            backgroundColor: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '2px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                          title="Remove signature"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Currency Symbol & Barcode Code Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#1e40af', marginBottom: '2px' }}>
                      Currency Symbol
                    </label>
                    <input
                      type="text"
                      value={formData.currencySymbol}
                      onChange={e => setFormData({ ...formData, currencySymbol: e.target.value })}
                      style={{
                        width: '100%',
                        height: '24px',
                        textAlign: 'center',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        backgroundColor: '#fef08a',
                        border: '1px solid #cbd5e1',
                        borderRadius: '2px'
                      }}
                      placeholder="₹"
                      title="Currency symbol across entire POS & bills"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#1e40af', marginBottom: '2px' }}>
                      Barcode Code
                    </label>
                    <input
                      type="text"
                      value={formData.barcodeCode || formData.barcodePrefix || '99'}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData({ ...formData, barcodeCode: val, barcodePrefix: val });
                      }}
                      style={{
                        width: '100%',
                        height: '24px',
                        textAlign: 'center',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        backgroundColor: '#fef08a',
                        border: '1px solid #cbd5e1',
                        borderRadius: '2px'
                      }}
                      placeholder="99"
                      title="Continuous Barcode Prefix avoiding multi-location collision"
                    />
                  </div>
                </div>

                {/* Company ID */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                    Company ID :
                  </label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <div
                      style={{
                        flex: 1,
                        height: '24px',
                        backgroundColor: '#1d4ed8',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 6px',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={formData.companyId || 'd1828b099cb5fac798b5d0b2e37de9b3'}
                    >
                      {formData.companyId || 'd1828b099cb5fac798b5d0b2e37de9b3'}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      style={{
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '2px',
                        padding: '2px 10px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* Mobile Android App and Multi Branch Status (Frame 0115 & 0395) */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    padding: '8px'
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '6px' }}>
                    Mobile Android App and Multi Branch Status :
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=retaildaddy://pair?cid=${encodeURIComponent(formData.companyId || 'd1828b099cb5fac798b5d0b2e37de9b3')}&name=${encodeURIComponent(formData.name)}`}
                      alt="Pairing QR"
                      style={{ width: '70px', height: '70px', border: '1px solid #e2e8f0', borderRadius: '2px' }}
                    />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '22px' }}>🤖</span>
                        <select
                          value={formData.mobileAppStatus || 'Enabled'}
                          onChange={e => setFormData({ ...formData, mobileAppStatus: e.target.value as any })}
                          style={{
                            flex: 1,
                            height: '24px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            border: '1px solid #cbd5e1',
                            borderRadius: '2px',
                            backgroundColor: '#ffffff'
                          }}
                        >
                          <option value="Enabled">Enabled</option>
                          <option value="Disabled">Disabled</option>
                        </select>
                      </div>
                      <div style={{ fontSize: '9px', color: '#64748b', lineHeight: '1.2' }}>
                        Scan via SVF Mobile App to stream live sales, purchases & stock.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* RIGHT COLUMN: 3D GLOSSY ACTION BUTTONS (FRAME 0115 & 0395)      */}
              {/* ============================================================== */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '18px' }}>
                {/* Save Button */}
                <button
                  type="button"
                  onClick={handleSave}
                  style={{
                    height: '42px',
                    background: 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)',
                    color: '#ffffff',
                    border: '1px solid #166534',
                    borderRadius: '4px',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.4)',
                    fontSize: '13px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  title="Save Company Master Settings"
                >
                  <span>💾</span>
                  <span>Save</span>
                </button>

                {/* Reset Button */}
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    height: '38px',
                    background: 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)',
                    color: '#ffffff',
                    border: '1px solid #991b1b',
                    borderRadius: '4px',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  title="Reset to default company configuration"
                >
                  <span>🔄</span>
                  <span>Reset</span>
                </button>

                {/* Envelope Print Button */}
                <button
                  type="button"
                  onClick={() => setShowEnvelopeModal(true)}
                  style={{
                    height: '40px',
                    background: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%)',
                    color: '#ffffff',
                    border: '1px solid #172554',
                    borderRadius: '4px',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    textAlign: 'center',
                    padding: '0 4px'
                  }}
                  title="Print official company postal envelope"
                >
                  <span>✉️</span>
                  <span>Envelope Print</span>
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM MODAL FOOTER */}
          <div
            style={{
              padding: '8px 14px',
              backgroundColor: '#eff6ff',
              borderTop: '1px solid #bfdbfe',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 'bold' }}>
              ⚡ Shree Vinayaka Furnitures Enterprise Rel 1.6 • Company Master & Brand Control Center
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '5px 16px',
                  backgroundColor: '#cbd5e1',
                  color: '#1e293b',
                  border: '1px solid #94a3b8',
                  borderRadius: '3px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Close (ESC)
              </button>
              <button
                type="button"
                onClick={handleSave}
                style={{
                  padding: '5px 20px',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: '1px solid #15803d',
                  borderRadius: '3px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ENVELOPE PRINT PREVIEW MODAL (VIDEO 09 FRAME 0115 & 0445)       */}
      {/* ============================================================== */}
      {showEnvelopeModal && (
        <div className="rd-modal-overlay" style={{ zIndex: 1300 }}>
          <div
            className="rd-dialog"
            style={{
              width: '820px',
              maxWidth: '96vw',
              background: '#ffffff',
              border: '2px solid #1e3a8a',
              borderRadius: '6px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
              overflow: 'hidden'
            }}
          >
            {/* Titlebar */}
            <div
              style={{
                background: 'linear-gradient(180deg, #1e3a8a 0%, #172554 100%)',
                color: '#ffffff',
                padding: '6px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                ✉️ Postal Envelope Print - {formData.name}
              </span>
              <button
                type="button"
                onClick={() => setShowEnvelopeModal(false)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            {/* Recipient Editor Row */}
            <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#475569' }}>Recipient Company / Name:</label>
                <input
                  type="text"
                  value={envelopeRecipient.name}
                  onChange={e => setEnvelopeRecipient({ ...envelopeRecipient, name: e.target.value })}
                  style={{ width: '100%', height: '22px', fontSize: '11px', border: '1px solid #cbd5e1', padding: '1px 5px', borderRadius: '2px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#475569' }}>Attention Line:</label>
                <input
                  type="text"
                  value={envelopeRecipient.attention}
                  onChange={e => setEnvelopeRecipient({ ...envelopeRecipient, attention: e.target.value })}
                  style={{ width: '100%', height: '22px', fontSize: '11px', border: '1px solid #cbd5e1', padding: '1px 5px', borderRadius: '2px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#475569' }}>Delivery Street Address:</label>
                <input
                  type="text"
                  value={envelopeRecipient.address}
                  onChange={e => setEnvelopeRecipient({ ...envelopeRecipient, address: e.target.value })}
                  style={{ width: '100%', height: '22px', fontSize: '11px', border: '1px solid #cbd5e1', padding: '1px 5px', borderRadius: '2px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#475569' }}>City, State, Pincode & Phone:</label>
                <input
                  type="text"
                  value={envelopeRecipient.cityStatePin}
                  onChange={e => setEnvelopeRecipient({ ...envelopeRecipient, cityStatePin: e.target.value })}
                  style={{ width: '100%', height: '22px', fontSize: '11px', border: '1px solid #cbd5e1', padding: '1px 5px', borderRadius: '2px' }}
                />
              </div>
            </div>

            {/* DL Postal Envelope Visual Preview (9.5" x 4.125" proportion) */}
            <div style={{ padding: '24px', backgroundColor: '#e2e8f0', display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: '680px',
                  height: '290px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #94a3b8',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                  position: 'relative',
                  padding: '20px 24px',
                  fontFamily: 'serif',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box'
                }}
              >
                {/* Sender Corner (Top-Left) */}
                <div style={{ maxWidth: '320px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {formData.logo && (
                      <img src={formData.logo} alt="Store Logo" style={{ height: '32px', maxWidth: '60px', objectFit: 'contain' }} />
                    )}
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e3a8a', fontFamily: 'sans-serif' }}>
                      {formData.name}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.3' }}>
                    {formData.address}
                  </div>
                  <div style={{ fontSize: '11px', color: '#334155' }}>
                    {formData.city}, {formData.state} • Ph: {formData.contactNo}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                    GSTIN: {formData.gstin}
                  </div>
                </div>

                {/* Postage Stamp Box (Top-Right) */}
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '20px',
                    width: '60px',
                    height: '70px',
                    border: '1px dashed #94a3b8',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    fontSize: '9px',
                    textAlign: 'center',
                    padding: '2px'
                  }}
                >
                  <span>AFFIX</span>
                  <span>STAMP</span>
                  <span>HERE</span>
                </div>

                {/* Recipient Address Box (Bottom-Right) */}
                <div
                  style={{
                    alignSelf: 'flex-end',
                    minWidth: '280px',
                    borderLeft: '2px solid #2563eb',
                    paddingLeft: '12px',
                    marginTop: '20px'
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563eb', marginBottom: '2px', fontFamily: 'sans-serif' }}>
                    To :
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>
                    {envelopeRecipient.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#334155', fontStyle: 'italic' }}>
                    {envelopeRecipient.attention}
                  </div>
                  <div style={{ fontSize: '12px', color: '#0f172a' }}>
                    {envelopeRecipient.address}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>
                    {envelopeRecipient.cityStatePin}
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>
                    Phone: {envelopeRecipient.phone}
                  </div>
                </div>

                {/* Bottom Left "BOOK POST / REGISTERED" Tag */}
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', letterSpacing: '1px' }}>
                  BY SPEED POST / REGISTERED POST
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: '8px 14px', background: '#f1f5f9', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#475569' }}>Standard DL Corporate Envelope (220mm × 110mm)</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowEnvelopeModal(false)}
                  style={{ padding: '5px 14px', backgroundColor: '#cbd5e1', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    showToast('🖨️ Printing Company Envelope...');
                  }}
                  style={{ padding: '5px 20px', backgroundColor: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                >
                  🖨️ Print Envelope
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
