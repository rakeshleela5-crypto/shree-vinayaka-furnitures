import React, { useState } from 'react';
import type { CompanyProfile } from '../../types/retailDaddy';

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCompany: (company: CompanyProfile) => void;
}

export const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({
  isOpen,
  onClose,
  onSaveCompany
}) => {
  const [name, setName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Kerala');
  const [financialYear, setFinancialYear] = useState('01-04-2024 - 31-03-2025');
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCompany: CompanyProfile = {
      id: 'comp-' + Date.now(),
      name: name.trim(),
      contactNo: contactNo.trim() || '+91 99999 00000',
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@retail.com`,
      gstin: gstin.trim() || '32AAAAA0000A1Z5',
      address: address.trim() || 'Commercial Market',
      city: city.trim() || 'City Center',
      state: state || 'Kerala',
      financialYear: financialYear || '01-04-2024 - 31-03-2025'
    };

    onSaveCompany(newCompany);
    setSuccessMsg(true);

    setTimeout(() => {
      setSuccessMsg(false);
      setName('');
      setContactNo('');
      setEmail('');
      setGstin('');
      setAddress('');
      setCity('');
      onClose();
    }, 1200);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999
      }}
    >
      <div
        style={{
          width: '500px',
          backgroundColor: '#f8fafc',
          border: '2px solid #0284c7',
          borderRadius: '8px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          fontFamily: 'Segoe UI, Tahoma, sans-serif'
        }}
      >
        {/* Title bar */}
        <div
          style={{
            backgroundColor: '#0284c7',
            padding: '8px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏢</span>
            <span>Create New Company / Store Database - Shree Vinayaka Furnitures</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#ef4444',
              border: 'none',
              color: '#fff',
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '16px' }}>
          {successMsg && (
            <div
              style={{
                padding: '8px 12px',
                marginBottom: '12px',
                borderRadius: '4px',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                fontSize: '13px',
                fontWeight: 'bold',
                border: '1px solid #86efac'
              }}
            >
              ✔ Company successfully created with isolated database!
            </div>
          )}

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1e293b', marginBottom: '3px' }}>
              Company / Store Name * :
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. GODREJ INTERIO - KANNUR or VINAYAKA WOOD STUDIO"
              required
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                backgroundColor: '#fff',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1e293b', marginBottom: '3px' }}>
                Contact No :
              </label>
              <input
                type="text"
                value={contactNo}
                onChange={e => setContactNo(e.target.value)}
                placeholder="+91 98470 54321"
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  fontSize: '13px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1e293b', marginBottom: '3px' }}>
                Email ID :
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="store@gmail.com"
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1e293b', marginBottom: '3px' }}>
                GSTIN / Tax No :
              </label>
              <input
                type="text"
                value={gstin}
                onChange={e => setGstin(e.target.value)}
                placeholder="32AAAAA0000A1Z5"
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  fontSize: '13px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1e293b', marginBottom: '3px' }}>
                Financial Year :
              </label>
              <input
                type="text"
                value={financialYear}
                onChange={e => setFinancialYear(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1e293b', marginBottom: '3px' }}>
              Address :
            </label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Commercial Complex, Road / Street"
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                backgroundColor: '#fff',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1e293b', marginBottom: '3px' }}>
                City :
              </label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Kochi / Bangalore"
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  fontSize: '13px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1e293b', marginBottom: '3px' }}>
                State :
              </label>
              <select
                value={state}
                onChange={e => setState(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  fontSize: '13px'
                }}
              >
                <option value="Kerala">Kerala</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Gujarat">Gujarat</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Delhi">Delhi</option>
                <option value="Punjab">Punjab</option>
                <option value="Telangana">Telangana</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '7px 16px',
                backgroundColor: '#94a3b8',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '7px 20px',
                backgroundColor: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(2,132,199,0.3)'
              }}
            >
              🏢 Create Company
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
