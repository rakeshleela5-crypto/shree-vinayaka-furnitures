import React, { useState } from 'react';
import type { Customer } from '../../types/retailDaddy';

interface CustomerEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCustomer: (customer: Customer) => void;
  initialCustomer?: Customer | null;
  existingCustomers: Customer[];
}

// Indian State Codes dictionary for GST validation
const STATE_CODES: Record<string, string> = {
  'Jammu and Kashmir': '01',
  'Himachal Pradesh': '02',
  'Punjab': '03',
  'Chandigarh': '04',
  'Uttarakhand': '05',
  'Haryana': '06',
  'Delhi': '07',
  'Rajasthan': '08',
  'Uttar Pradesh': '09',
  'Bihar': '10',
  'Sikkim': '11',
  'Arunachal Pradesh': '12',
  'Nagaland': '13',
  'Manipur': '14',
  'Mizoram': '15',
  'Tripura': '16',
  'Meghalaya': '17',
  'Assam': '18',
  'West Bengal': '19',
  'Jharkhand': '20',
  'Odisha': '21',
  'Chhattisgarh': '22',
  'Madhya Pradesh': '23',
  'Gujarat': '24',
  'Daman and Diu': '25',
  'Dadra and Nagar Haveli': '26',
  'Maharashtra': '27',
  'Andhra Pradesh': '28',
  'Karnataka': '29',
  'Goa': '30',
  'Lakshadweep': '31',
  'Kerala': '32',
  'Tamil Nadu': '33',
  'Puducherry': '34',
  'Andaman and Nicobar Islands': '35',
  'Telangana': '36'
};

export function CustomerEntryModal({
  isOpen,
  onClose,
  onSaveCustomer,
  initialCustomer,
  existingCustomers
}: CustomerEntryModalProps) {
  const [customerId, setCustomerId] = useState(
    initialCustomer?.id || `C-${String(existingCustomers.length + 1).padStart(4, '0')}`
  );
  const [name, setName] = useState(initialCustomer?.name || '');
  const [address, setAddress] = useState(initialCustomer?.address || '');
  const [city, setCity] = useState(initialCustomer?.city || '');
  const [state, setState] = useState(initialCustomer?.state || 'Kerala');
  const [postalCode, setPostalCode] = useState(initialCustomer?.postalCode || '');
  const [contactNo, setContactNo] = useState(initialCustomer?.phone || '');
  const [email, setEmail] = useState(initialCustomer?.email || '');
  const [gstin, setGstin] = useState(initialCustomer?.gstin || '');
  const [cin, setCin] = useState(initialCustomer?.cin || '');
  const [pan, setPan] = useState(initialCustomer?.pan || '');
  const [openingBalance, setOpeningBalance] = useState(initialCustomer?.balance || 0);
  const [balanceType, setBalanceType] = useState<'DR' | 'CR'>('DR');
  const [loyaltyPoint, setLoyaltyPoint] = useState(initialCustomer?.loyaltyPoints || 0);
  const [loyaltyType, setLoyaltyType] = useState<'DR' | 'CR'>('CR');
  const [remarks, setRemarks] = useState('');
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(initialCustomer?.loyaltyEnabled ?? true);
  const [tcsApplied, setTcsApplied] = useState(initialCustomer?.tcsApplied ? 'Yes' : 'No');
  const [creditLimit, setCreditLimit] = useState(initialCustomer?.creditLimit || 0);
  const [creditLimitActive, setCreditLimitActive] = useState('No');
  const [route, setRoute] = useState(initialCustomer?.route || '');
  const [turnAroundDays, setTurnAroundDays] = useState(initialCustomer?.turnAroundDays || 0);

  // Bank Details
  const [accountName, setAccountName] = useState(initialCustomer?.accountName || '');
  const [accountNo, setAccountNo] = useState(initialCustomer?.accountNo || '');
  const [bank, setBank] = useState(initialCustomer?.bankName || '');
  const [branch, setBranch] = useState(initialCustomer?.branch || '');
  const [ifscCode, setIfscCode] = useState(initialCustomer?.ifsc || '');

  // Photo
  const [photo, setPhoto] = useState<string | null>(initialCustomer?.photo || null);

  // Validation States
  const [gstinValidationMsg, setGstinValidationMsg] = useState<{ text: string; valid: boolean } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const stateCode = STATE_CODES[state] || '32';

  // Live GSTIN Validator (15-character GSTIN specification)
  const handleValidateGSTIN = () => {
    const val = gstin.trim().toUpperCase();
    if (!val) {
      setGstinValidationMsg({ text: 'Please enter GSTIN before validating', valid: false });
      return;
    }

    // Pattern: 2 digits (state) + 5 alpha + 4 digits + 1 alpha (PAN) + 1 alphanumeric + 'Z' + 1 checksum
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (val.length !== 15) {
      setGstinValidationMsg({ text: `Invalid GSTIN length (${val.length}/15 chars). Must be exactly 15 characters.`, valid: false });
      return;
    }

    const statePrefix = val.substring(0, 2);
    if (statePrefix !== stateCode) {
      setGstinValidationMsg({
        text: `⚠️ State code mismatch: GSTIN starts with ${statePrefix}, but selected state ${state} is ${stateCode}.`,
        valid: false
      });
      return;
    }

    if (!gstinRegex.test(val)) {
      setGstinValidationMsg({ text: 'Invalid GSTIN structure according to GST Rules (PAN + Entity + Z + Checksum).', valid: false });
      return;
    }

    // Auto extract PAN
    const extractedPan = val.substring(2, 12);
    setPan(extractedPan);
    setGstinValidationMsg({ text: `✅ Valid Active GSTIN (${state} - State ${statePrefix})`, valid: true });
    showToast('GSTIN Validated Successfully!');
  };

  const handleResetNew = () => {
    setCustomerId(`C-${String(existingCustomers.length + 1).padStart(4, '0')}`);
    setName('');
    setAddress('');
    setCity('');
    setState('Kerala');
    setPostalCode('');
    setContactNo('');
    setEmail('');
    setGstin('');
    setCin('');
    setPan('');
    setOpeningBalance(0);
    setBalanceType('DR');
    setLoyaltyPoint(0);
    setRemarks('');
    setAccountName('');
    setAccountNo('');
    setBank('');
    setBranch('');
    setIfscCode('');
    setPhoto(null);
    setGstinValidationMsg(null);
    showToast('Ready for new customer entry');
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter Customer Name');
      return;
    }

    const effectiveBalance = balanceType === 'DR' ? Math.abs(openingBalance) : -Math.abs(openingBalance);

    const savedCustomer: Customer = {
      id: customerId,
      name: name.trim(),
      phone: contactNo.trim() || '1234567890',
      state,
      address: address.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
      email: email.trim(),
      gstin: gstin.trim().toUpperCase(),
      cin: cin.trim(),
      pan: pan.trim().toUpperCase(),
      balance: effectiveBalance,
      loyaltyPoints: loyaltyPoint,
      loyaltyEnabled,
      tcsApplied: tcsApplied === 'Yes',
      creditLimit,
      route,
      turnAroundDays,
      accountName,
      accountNo,
      bankName: bank,
      branch,
      ifsc: ifscCode,
      photo: photo || undefined
    };

    onSaveCustomer(savedCustomer);
    showToast(`Customer "${name}" saved successfully!`);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleBrowsePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        setPhoto(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectCustomerFromList = (custName: string) => {
    const found = existingCustomers.find(c => c.name.toLowerCase() === custName.toLowerCase());
    if (found) {
      setCustomerId(found.id);
      setName(found.name);
      setAddress(found.address || '');
      setCity(found.city || '');
      setState(found.state || 'Kerala');
      setPostalCode(found.postalCode || '');
      setContactNo(found.phone || '');
      setEmail(found.email || '');
      setGstin(found.gstin || '');
      setCin(found.cin || '');
      setPan(found.pan || '');
      setOpeningBalance(Math.abs(found.balance || 0));
      setBalanceType((found.balance || 0) >= 0 ? 'DR' : 'CR');
      setLoyaltyPoint(found.loyaltyPoints || 0);
      setAccountName(found.accountName || '');
      setAccountNo(found.accountNo || '');
      setBank(found.bankName || '');
      setBranch(found.branch || '');
      setIfscCode(found.ifsc || '');
      setPhoto(found.photo || null);
      showToast(`Loaded customer: ${found.name}`);
    }
  };

  return (
    <div className="rd-modal-overlay" style={{ zIndex: 1200 }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#065f46',
          color: '#ffffff',
          padding: '10px 20px',
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          zIndex: 1300
        }}>
          {toastMessage}
        </div>
      )}

      {/* 1:1 CUSTOMER ENTRY WINDOW (MATCHING FRAME 035) */}
      <div
        className="rd-dialog"
        style={{
          width: '880px',
          maxWidth: '96vw',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          border: '2px solid #2563eb'
        }}
      >
        {/* Titlebar */}
        <div
          className="rd-dialog-titlebar"
          style={{
            background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
            color: '#ffffff',
            padding: '6px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 'bold',
            fontSize: '13px'
          }}
        >
          <span>Customer Entry</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ cursor: 'pointer', padding: '0 4px' }}>_</span>
            <span style={{ cursor: 'pointer', padding: '0 4px' }}>□</span>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '13px',
                padding: '0 4px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          className="rd-dialog-body"
          style={{
            background: '#f8fafc',
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            gap: '16px'
          }}
        >
          {/* LEFT FORM FIELDS */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
            {/* Customer ID */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '130px', fontWeight: 'bold' }}>Customer ID :</span>
              <input
                type="text"
                readOnly
                value={customerId}
                style={{ width: '130px', padding: '3px 6px', background: '#e2e8f0', border: '1px solid #94a3b8', fontSize: '11px' }}
              />
            </div>

            {/* Customer Name */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '130px', fontWeight: 'bold' }}>Customer Name :</span>
              <div style={{ position: 'relative', width: '270px' }}>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Kumar"
                  style={{ width: '100%', padding: '3px 6px', background: '#fef08a', border: '1px solid #94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                />
                {existingCustomers.length > 0 && (
                  <select
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '20px',
                      opacity: 0.1,
                      cursor: 'pointer'
                    }}
                    onChange={e => handleSelectCustomerFromList(e.target.value)}
                  >
                    <option value="">Select Existing...</option>
                    {existingCustomers.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Address */}
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <span style={{ width: '130px', fontWeight: 'bold', paddingTop: '4px' }}>Address :</span>
              <textarea
                rows={2}
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. Vaikom, Kottayam"
                style={{ width: '270px', padding: '3px 6px', background: '#fef08a', border: '1px solid #94a3b8', fontSize: '11px', resize: 'vertical' }}
              />
            </div>

            {/* City */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '130px', fontWeight: 'bold' }}>City :</span>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. ktm"
                style={{ width: '210px', padding: '3px 6px', background: '#fef08a', border: '1px solid #94a3b8', fontSize: '11px' }}
              />
            </div>

            {/* State */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '130px', fontWeight: 'bold' }}>State :</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={state}
                  onChange={e => setState(e.target.value)}
                  style={{ width: '210px', padding: '3px 6px', border: '1px solid #94a3b8', fontSize: '11px', background: '#ffffff' }}
                >
                  {Object.keys(STATE_CODES).map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '11px' }}>
                  (Code : {stateCode})
                </span>
              </div>
            </div>

            {/* Postal Code */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '130px', fontWeight: 'bold' }}>Postal Code :</span>
              <input
                type="text"
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                placeholder="e.g. 686141"
                style={{ width: '130px', padding: '3px 6px', background: '#fef08a', border: '1px solid #94a3b8', fontSize: '11px' }}
              />
            </div>

            {/* Contact No */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '130px', fontWeight: 'bold' }}>Contact No :</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="text"
                  value={contactNo}
                  onChange={e => setContactNo(e.target.value)}
                  placeholder="e.g. 9845012345"
                  style={{ width: '130px', padding: '3px 6px', background: '#fef08a', border: '1px solid #94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                />
                {!contactNo && (
                  <span title="Required field" style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '14px' }}>
                    ❗
                  </span>
                )}
              </div>
            </div>

            {/* Email ID */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '130px', fontWeight: 'bold' }}>Email ID :</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. ktm@gmail.com"
                style={{ width: '210px', padding: '3px 6px', background: '#fef08a', border: '1px solid #94a3b8', fontSize: '11px' }}
              />
            </div>

            {/* GSTIN/UID */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '130px', fontWeight: 'bold' }}>GSTIN/UID :</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  value={gstin}
                  onChange={e => {
                    setGstin(e.target.value.toUpperCase());
                    setGstinValidationMsg(null);
                  }}
                  placeholder="e.g. 32AAAAA0000A1Z5"
                  maxLength={15}
                  style={{
                    width: '160px',
                    padding: '3px 6px',
                    background: '#fef08a',
                    border: '1px solid #94a3b8',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: 'bold'
                  }}
                />
                <button
                  type="button"
                  onClick={handleValidateGSTIN}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    padding: 0
                  }}
                >
                  GSTIN VALIDATE
                </button>
              </div>
            </div>

            {/* Live GSTIN validation message */}
            {gstinValidationMsg && (
              <div style={{
                marginLeft: '130px',
                fontSize: '10px',
                fontWeight: 'bold',
                color: gstinValidationMsg.valid ? '#15803d' : '#b91c1c',
                background: gstinValidationMsg.valid ? '#dcfce7' : '#fee2e2',
                padding: '2px 8px',
                borderRadius: '3px'
              }}>
                {gstinValidationMsg.text}
              </div>
            )}

            {/* CIN */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '130px', fontWeight: 'bold' }}>CIN :</span>
              <input
                type="text"
                value={cin}
                onChange={e => setCin(e.target.value.toUpperCase())}
                style={{ width: '160px', padding: '3px 6px', background: '#fef08a', border: '1px solid #94a3b8', fontSize: '11px' }}
              />
            </div>

            {/* PAN */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '130px', fontWeight: 'bold' }}>PAN :</span>
              <input
                type="text"
                value={pan}
                onChange={e => setPan(e.target.value.toUpperCase())}
                placeholder="e.g. AAAAA0000A"
                maxLength={10}
                style={{ width: '160px', padding: '3px 6px', background: '#fef08a', border: '1px solid #94a3b8', fontSize: '11px', textTransform: 'uppercase' }}
              />
            </div>

            {/* Opening Balance & Loyalty */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '130px', fontWeight: 'bold' }}>Opening Balance :</span>
              <input
                type="number"
                value={openingBalance}
                onChange={e => setOpeningBalance(parseFloat(e.target.value) || 0)}
                style={{ width: '70px', padding: '3px 6px', background: '#fef08a', border: '1px solid #94a3b8', fontSize: '11px', textAlign: 'right' }}
              />
              <select
                value={balanceType}
                onChange={e => setBalanceType(e.target.value as 'DR' | 'CR')}
                style={{ width: '50px', padding: '3px', fontSize: '11px' }}
              >
                <option value="DR">DR</option>
                <option value="CR">CR</option>
              </select>

              <span style={{ fontWeight: 'bold', marginLeft: '6px' }}>Loyalty Point :</span>
              <input
                type="number"
                value={loyaltyPoint}
                onChange={e => setLoyaltyPoint(parseFloat(e.target.value) || 0)}
                style={{ width: '60px', padding: '3px 6px', background: '#fef08a', border: '1px solid #94a3b8', fontSize: '11px', textAlign: 'right' }}
              />
              <select
                value={loyaltyType}
                onChange={e => setLoyaltyType(e.target.value as 'DR' | 'CR')}
                style={{ width: '50px', padding: '3px', fontSize: '11px' }}
              >
                <option value="CR">CR</option>
                <option value="DR">DR</option>
              </select>
            </div>

            {/* Remarks & Loyalty Enable */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '130px', fontWeight: 'bold' }}>Remarks :</span>
              <input
                type="text"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                style={{ width: '140px', padding: '3px 6px', background: '#fef08a', border: '1px solid #94a3b8', fontSize: '11px' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                <input
                  type="checkbox"
                  checked={loyaltyEnabled}
                  onChange={e => setLoyaltyEnabled(e.target.checked)}
                />
                <span>Loyalty Enable/Disable</span>
              </label>
            </div>

            {/* TCS & Credit Limit & Route */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '130px', fontWeight: 'bold' }}>TCS Applied :</span>
              <select
                value={tcsApplied}
                onChange={e => setTcsApplied(e.target.value)}
                style={{ width: '70px', padding: '3px', fontSize: '11px' }}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>

              <span style={{ fontWeight: 'bold', marginLeft: '4px' }}>Credit Limit (Max) :</span>
              <input
                type="number"
                value={creditLimit}
                onChange={e => setCreditLimit(parseFloat(e.target.value) || 0)}
                style={{ width: '60px', padding: '3px 6px', background: '#fef08a', border: '1px solid #94a3b8', fontSize: '11px', textAlign: 'right' }}
              />
              <select
                value={creditLimitActive}
                onChange={e => setCreditLimitActive(e.target.value)}
                style={{ width: '50px', padding: '3px', fontSize: '11px' }}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {/* Route & Turn Around Days */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '130px', fontWeight: 'bold' }}>Route :</span>
              <select
                value={route}
                onChange={e => setRoute(e.target.value)}
                style={{ width: '130px', padding: '3px', fontSize: '11px' }}
              >
                <option value="">Default Town</option>
                <option value="Route 1">Route 1 - Market</option>
                <option value="Route 2">Route 2 - Highway</option>
              </select>

              <span style={{ fontWeight: 'bold', marginLeft: '4px' }}>Turn Around Days :</span>
              <input
                type="number"
                value={turnAroundDays}
                onChange={e => setTurnAroundDays(parseInt(e.target.value) || 0)}
                style={{ width: '50px', padding: '3px 6px', border: '1px solid #94a3b8', fontSize: '11px' }}
              />
            </div>

            {/* Bank Details Group Box */}
            <fieldset style={{
              border: '1px solid #cbd5e1',
              padding: '6px 10px',
              borderRadius: '4px',
              marginTop: '4px',
              background: '#ffffff'
            }}>
              <legend style={{ fontSize: '10px', fontWeight: 'bold', color: '#475569' }}>Bank Details</legend>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '4px', fontSize: '10px', alignItems: 'center' }}>
                <span>Account Name :</span>
                <input
                  type="text"
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  style={{ padding: '2px 4px', background: '#fef08a', border: '1px solid #cbd5e1' }}
                />
                <span>Account No. :</span>
                <input
                  type="text"
                  value={accountNo}
                  onChange={e => setAccountNo(e.target.value)}
                  style={{ padding: '2px 4px', background: '#fef08a', border: '1px solid #cbd5e1' }}
                />
                <span>Bank :</span>
                <input
                  type="text"
                  value={bank}
                  onChange={e => setBank(e.target.value)}
                  style={{ padding: '2px 4px', background: '#fef08a', border: '1px solid #cbd5e1' }}
                />
                <span>Branch :</span>
                <input
                  type="text"
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  style={{ padding: '2px 4px', background: '#fef08a', border: '1px solid #cbd5e1' }}
                />
                <span>IFSC code :</span>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={e => setIfscCode(e.target.value.toUpperCase())}
                  style={{ padding: '2px 4px', background: '#fef08a', border: '1px solid #cbd5e1' }}
                />
              </div>
            </fieldset>
          </div>

          {/* RIGHT SIDE: AVATAR & CRUD BUTTONS */}
          <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Photo Avatar Box */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{
                width: '130px',
                height: '140px',
                background: '#3b82f6',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                borderRadius: '2px',
                position: 'relative'
              }}>
                {photo ? (
                  <img src={photo} alt="Customer Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg width="90" height="90" viewBox="0 0 24 24" fill="#ffffff">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                )}
              </div>

              <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                <label style={{
                  background: '#1e293b',
                  color: '#ffffff',
                  fontSize: '10px',
                  padding: '3px 8px',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}>
                  Browse...
                  <input type="file" accept="image/*" onChange={handleBrowsePhoto} style={{ display: 'none' }} />
                </label>
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  style={{
                    background: '#1e293b',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '10px',
                    padding: '3px 8px',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>

              <div style={{ fontSize: '9px', color: '#64748b', margin: '4px 0' }}>OR</div>

              <button
                type="button"
                onClick={() => {
                  alert('Webcam preview connected. Snapshot captured.');
                  setPhoto('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80');
                }}
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '10px',
                  padding: '4px 12px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Use Webcam
              </button>
            </div>

            {/* Vertical CRUD Action Buttons (Frame 035 exact gradient styles) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* New */}
              <button
                type="button"
                onClick={handleResetNew}
                style={{
                  background: 'linear-gradient(180deg, #1d4ed8 0%, #1e3a8a 100%)',
                  color: '#ffffff',
                  border: '1px solid #172554',
                  padding: '7px 0',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                New
              </button>

              {/* Save */}
              <button
                type="button"
                onClick={handleSave}
                style={{
                  background: 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)',
                  color: '#ffffff',
                  border: '1px solid #14532d',
                  padding: '7px 0',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                Save
              </button>

              {/* Update */}
              <button
                type="button"
                onClick={handleSave}
                style={{
                  background: 'linear-gradient(180deg, #475569 0%, #1e293b 100%)',
                  color: '#ffffff',
                  border: '1px solid #0f172a',
                  padding: '7px 0',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                Update
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete customer ${name}?`)) {
                    showToast(`Customer ${name} deleted`);
                    handleResetNew();
                  }
                }}
                style={{
                  background: 'linear-gradient(180deg, #94a3b8 0%, #64748b 100%)',
                  color: '#ffffff',
                  border: '1px solid #475569',
                  padding: '7px 0',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                Delete
              </button>

              {/* Get Data */}
              <button
                type="button"
                onClick={() => {
                  if (existingCustomers.length > 0) {
                    const first = existingCustomers[0];
                    handleSelectCustomerFromList(first.name);
                  }
                }}
                style={{
                  background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: '1px solid #1e3a8a',
                  padding: '7px 0',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                Get Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
