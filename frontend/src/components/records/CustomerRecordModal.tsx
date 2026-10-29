import React, { useState } from 'react';
import type { Customer } from '../../types/retailDaddy';
import { exportToExcel, exportToJson, exportToCsv } from '../../utils/csvImporter';

interface CustomerRecordModalProps {
  isOpen: boolean;
  customers: Customer[];
  onAddCustomer: (customer: Customer) => Promise<void> | void;
  onSelectCustomer?: (customer: Customer) => void;
  onDeleteCustomer?: (customerId: string) => Promise<void> | void;
  onClose: () => void;
}

export const CustomerRecordModal: React.FC<CustomerRecordModalProps> = ({
  isOpen,
  customers,
  onAddCustomer,
  onSelectCustomer,
  onDeleteCustomer,
  onClose
}) => {
  // Search inputs matching Video 07 Frame 0025
  const [searchName, setSearchName] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchContact, setSearchContact] = useState('');
  const [searchRoute, setSearchRoute] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Quick Add Customer modal state (Video 07 Frames 0035, 0095)
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustCity, setNewCustCity] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustState, setNewCustState] = useState('Kerala');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredCustomers = customers.filter(c => {
    const matchName = searchName ? c.name.toLowerCase().includes(searchName.toLowerCase()) : true;
    const matchCity = searchCity ? (c.address || '').toLowerCase().includes(searchCity.toLowerCase()) : true;
    const matchContact = searchContact ? (c.phone || '').includes(searchContact) : true;
    const matchRoute = searchRoute ? (c.route || '').toLowerCase().includes(searchRoute.toLowerCase()) : true;
    return matchName && matchCity && matchContact && matchRoute;
  });

  const handleReset = () => {
    setSearchName('');
    setSearchCity('');
    setSearchContact('');
    setSearchRoute('');
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      showToast('⚠️ Please enter Customer Name');
      return;
    }

    const nextIdNum = customers.length + 10;
    const newCust: Customer = {
      id: `C-${String(nextIdNum).padStart(4, '0')}`,
      name: newCustName.trim(),
      phone: newCustPhone.trim() || '9898000000',
      address: newCustAddress.trim() || 'local',
      city: newCustCity.trim() || 'localcity',
      state: newCustState || 'Kerala',
      email: newCustEmail.trim() || 'abc@gmail.com',
      balance: 0,
      loyaltyPoints: 0,
      route: 'Main Market',
      openingBalance: 0
    };

    setIsSaving(true);
    try {
      await onAddCustomer(newCust);
      setShowAddDialog(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustCity('');
      setNewCustAddress('');
      setNewCustEmail('');
      showToast(`✓ Customer "${newCust.name}" inserted successfully!`);
    } catch (err: any) {
      console.error('Failed to save customer:', err);
      showToast(`❌ Failed to save customer: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportExcel = () => {
    const headers = ['Customer ID', 'Customer Name', 'Address', 'City', 'State', 'Contact No', 'Email ID', 'GSTIN/UID', 'Opening Balance'];
    const rows = filteredCustomers.map(c => [
      c.id,
      c.name,
      c.address || 'local',
      c.city || 'localcity',
      c.state || 'Kerala',
      c.phone,
      c.email || 'abc@gmail.com',
      c.gstin || '0',
      c.openingBalance || 0
    ]);
    exportToExcel(`Customer_Records_${new Date().toISOString().slice(0, 10)}`, headers, rows, 'Customers');
    showToast('📊 Export to Excel (.xlsx) completed successfully!');
  };

  const handleExportJson = () => {
    exportToJson(`Customer_Records_${new Date().toISOString().slice(0, 10)}`, filteredCustomers);
    showToast('📋 Export to JSON (.json) completed successfully!');
  };

  const handleExportCsv = () => {
    const headers = ['Customer ID', 'Customer Name', 'Address', 'City', 'State', 'Contact No', 'Email ID', 'GSTIN/UID', 'Opening Balance'];
    const rows = filteredCustomers.map(c => [
      c.id,
      c.name,
      c.address || 'local',
      c.city || 'localcity',
      c.state || 'Kerala',
      c.phone,
      c.email || 'abc@gmail.com',
      c.gstin || '0',
      c.openingBalance || 0
    ]);
    exportToCsv(`Customer_Records_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    showToast('📄 Export to CSV (.csv) completed successfully!');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
      {/* Main Window Frame (Video 07 Frame 0025) */}
      <div
        style={{
          width: '98%',
          maxWidth: '1150px',
          height: '92vh',
          maxHeight: '680px',
          backgroundColor: '#f1f5f9',
          border: '2px solid #0284c7',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 45px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar Banner (Frame 0025: Top 10 Records badge + Blue banner) */}
        <div
          style={{
            background: 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)',
            color: '#ffffff',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #0284c7',
            userSelect: 'none'
          }}
        >
          {/* Top Records Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                padding: '1px 8px',
                fontSize: '11px',
                fontWeight: '900',
                borderRadius: '3px',
                letterSpacing: '0.5px'
              }}
            >
              Top
            </span>
            <span
              style={{
                backgroundColor: '#ffffff',
                color: '#1e3a8a',
                padding: '1px 10px',
                fontSize: '11px',
                fontWeight: '900',
                borderRadius: '2px'
              }}
            >
              10
            </span>
            <span
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                padding: '1px 8px',
                fontSize: '11px',
                fontWeight: '900',
                borderRadius: '3px'
              }}
            >
              Records
            </span>
          </div>

          {/* Center Banner Title */}
          <div style={{ fontSize: '15px', fontWeight: 'bold', letterSpacing: '0.5px', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
            List of Customers
          </div>

          {/* Window Control Buttons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#e11d48',
                border: '1px solid #ffffff',
                color: '#ffffff',
                width: '26px',
                height: '22px',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Bar (Video 07 Frame 0025: 4 search boxes + Reset + Export Excel + Add Customer) */}
        <div
          style={{
            background: '#ffffff',
            padding: '8px 12px',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            gap: '10px'
          }}
        >
          {/* 1. Search By Customer Name */}
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
              Search By Customer Name
            </label>
            <input
              type="text"
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              placeholder="e.g. Sundar, Shibin..."
              style={{
                width: '100%',
                height: '26px',
                border: '1px solid #94a3b8',
                borderRadius: '2px',
                padding: '0 6px',
                fontSize: '12px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 2. Search By City */}
          <div style={{ flex: '1 1 140px' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
              Search By City
            </label>
            <input
              type="text"
              value={searchCity}
              onChange={e => setSearchCity(e.target.value)}
              placeholder="e.g. localcity..."
              style={{
                width: '100%',
                height: '26px',
                border: '1px solid #94a3b8',
                borderRadius: '2px',
                padding: '0 6px',
                fontSize: '12px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 3. Search By Contact No */}
          <div style={{ flex: '1 1 140px' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
              Search By Contact No :
            </label>
            <input
              type="text"
              value={searchContact}
              onChange={e => setSearchContact(e.target.value)}
              placeholder="e.g. 8078311945..."
              style={{
                width: '100%',
                height: '26px',
                border: '1px solid #94a3b8',
                borderRadius: '2px',
                padding: '0 6px',
                fontSize: '12px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 4. Search By Route */}
          <div style={{ flex: '1 1 140px' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
              Search By Route
            </label>
            <input
              type="text"
              value={searchRoute}
              onChange={e => setSearchRoute(e.target.value)}
              placeholder="e.g. Main Route..."
              style={{
                width: '100%',
                height: '26px',
                border: '1px solid #94a3b8',
                borderRadius: '2px',
                padding: '0 6px',
                fontSize: '12px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {/* Reset Button */}
            <button
              type="button"
              onClick={handleReset}
              style={{
                height: '28px',
                padding: '0 14px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: '1px solid #b91c1c',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}
              title="Clear all filters"
            >
              Reset
            </button>

            {/* Export Excel Button (.xlsx) */}
            <button
              type="button"
              onClick={handleExportExcel}
              style={{
                height: '28px',
                padding: '0 12px',
                background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
                color: '#ffffff',
                border: '1px solid #15803d',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}
              title="Export Customer Master to Excel (.xlsx)"
            >
              📊 Excel (.xlsx)
            </button>

            {/* Export JSON Button (.json) */}
            <button
              type="button"
              onClick={handleExportJson}
              style={{
                height: '28px',
                padding: '0 12px',
                background: '#475569',
                color: '#ffffff',
                border: '1px solid #334155',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}
              title="Export Customer Master to JSON (.json)"
            >
              📋 JSON (.json)
            </button>

            {/* Export CSV Button (.csv) */}
            <button
              type="button"
              onClick={handleExportCsv}
              style={{
                height: '28px',
                padding: '0 10px',
                background: '#2563eb',
                color: '#ffffff',
                border: '1px solid #1d4ed8',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}
              title="Export Customer Master to CSV (.csv)"
            >
              📄 CSV
            </button>

            {/* Add Customer Button (Frame 0025: Deep blue) */}
            <button
              type="button"
              onClick={() => setShowAddDialog(true)}
              style={{
                height: '28px',
                padding: '0 16px',
                background: 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)',
                color: '#ffffff',
                border: '1px solid #1e3a8a',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}
              title="Add New Customer"
            >
              + Add Customer
            </button>
          </div>
        </div>

        {/* Table Content (Frame 0025: 12-column table with Navy `#003366` header) */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#ffffff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: '#003366', color: '#ffffff', textAlign: 'left', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '30px', textAlign: 'center' }}>▷</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '80px' }}>Customer ID</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', minWidth: '160px' }}>Customer Name</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', minWidth: '100px' }}>Address</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', minWidth: '90px' }}>City</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', minWidth: '80px' }}>State</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', minWidth: '70px' }}>Postal Code</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', minWidth: '100px' }}>Contact No.</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', minWidth: '130px' }}>Email ID</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '70px' }}>GSTIN/UID</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '60px' }}>CIN</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '80px' }}>Route</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', width: '90px' }}>Opening Bal</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={13} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No customer records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust, idx) => {
                  const isSelected = selectedCustomerId === cust.id;
                  return (
                    <tr
                      key={cust.id}
                      onClick={() => setSelectedCustomerId(cust.id)}
                      onDoubleClick={() => onSelectCustomer && onSelectCustomer(cust)}
                      style={{
                        backgroundColor: isSelected ? '#bae6fd' : idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        color: '#0f172a'
                      }}
                    >
                      <td style={{ padding: '5px 8px', textAlign: 'center', color: '#0284c7', fontWeight: 'bold' }}>
                        {isSelected ? '▶' : ''} {idx + 1}
                      </td>
                      <td style={{ padding: '5px 8px', fontWeight: 'bold', color: '#1e40af' }}>{cust.id}</td>
                      <td style={{ padding: '5px 8px', fontWeight: 'bold' }}>{cust.name}</td>
                      <td style={{ padding: '5px 8px', color: '#475569' }}>{cust.address || 'local'}</td>
                      <td style={{ padding: '5px 8px', color: '#475569' }}>localcity</td>
                      <td style={{ padding: '5px 8px', color: '#475569' }}>Kerala</td>
                      <td style={{ padding: '5px 8px', color: '#64748b' }}>682001</td>
                      <td style={{ padding: '5px 8px', fontWeight: '500' }}>{cust.phone}</td>
                      <td style={{ padding: '5px 8px', color: '#64748b' }}>{cust.email || 'abc@gmail.com'}</td>
                      <td style={{ padding: '5px 8px', color: '#64748b' }}>0</td>
                      <td style={{ padding: '5px 8px', color: '#64748b' }}>-</td>
                      <td style={{ padding: '5px 8px', color: '#64748b' }}>{cust.route || 'Main'}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                        ₹{(cust.openingBalance || 0).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Status Bar */}
        <div
          style={{
            background: '#e2e8f0',
            borderTop: '1px solid #cbd5e1',
            padding: '4px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#475569'
          }}
        >
          <div>
            Total Records: <strong>{filteredCustomers.length}</strong> customers listed
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: '#0284c7' }}>Double click any customer to view ledger / edit</span>
            {selectedCustomerId && onDeleteCustomer && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  const cust = customers.find(c => c.id === selectedCustomerId || (c as any).code === selectedCustomerId);
                  if (window.confirm(`Are you sure you want to deactivate and remove customer "${cust?.name || selectedCustomerId}"?`)) {
                    setIsDeleting(true);
                    try {
                      await onDeleteCustomer(selectedCustomerId);
                      showToast(`Customer "${cust?.name || selectedCustomerId}" deactivated successfully!`);
                      setSelectedCustomerId(null);
                    } catch (err: any) {
                      console.error('Failed to delete customer:', err);
                      showToast(`❌ Failed to delete customer: ${err.message || 'Unknown error'}`);
                    } finally {
                      setIsDeleting(false);
                    }
                  }
                }}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: '1px solid #b91c1c',
                  borderRadius: '2px',
                  padding: '2px 10px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1
                }}
              >
                {isDeleting ? '⏳ Deleting...' : '🗑️ Delete Selected'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #94a3b8',
                borderRadius: '2px',
                padding: '2px 10px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Dialog (Frames 0035, 0095) */}
      {showAddDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              width: '420px',
              backgroundColor: '#ffffff',
              border: '2px solid #1d4ed8',
              borderRadius: '4px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                background: 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)',
                color: '#ffffff',
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>+ Add Customer</span>
              <button
                type="button"
                onClick={() => setShowAddDialog(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} style={{ padding: '12px' }}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  placeholder="e.g. Suman, Sukumar"
                  style={{ width: '100%', height: '26px', border: '1px solid #94a3b8', borderRadius: '3px', padding: '0 6px', fontSize: '12px' }}
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={e => setNewCustPhone(e.target.value)}
                  placeholder="e.g. 9847123456"
                  style={{ width: '100%', height: '26px', border: '1px solid #94a3b8', borderRadius: '3px', padding: '0 6px', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                    City / Locality
                  </label>
                  <input
                    type="text"
                    value={newCustCity}
                    onChange={e => setNewCustCity(e.target.value)}
                    placeholder="e.g. Palakkad"
                    style={{ width: '100%', height: '26px', border: '1px solid #94a3b8', borderRadius: '3px', padding: '0 6px', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                    State
                  </label>
                  <input
                    type="text"
                    value={newCustState}
                    onChange={e => setNewCustState(e.target.value)}
                    style={{ width: '100%', height: '26px', border: '1px solid #94a3b8', borderRadius: '3px', padding: '0 6px', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                  Email ID
                </label>
                <input
                  type="email"
                  value={newCustEmail}
                  onChange={e => setNewCustEmail(e.target.value)}
                  placeholder="e.g. customer@example.com"
                  style={{ width: '100%', height: '26px', border: '1px solid #94a3b8', borderRadius: '3px', padding: '0 6px', fontSize: '12px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                  Address
                </label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={e => setNewCustAddress(e.target.value)}
                  placeholder="e.g. Market Road, Door No 12"
                  style={{ width: '100%', height: '26px', border: '1px solid #94a3b8', borderRadius: '3px', padding: '0 6px', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddDialog(false)}
                  style={{
                    padding: '5px 12px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    padding: '5px 16px',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: '1px solid #15803d',
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.7 : 1
                  }}
                >
                  {isSaving ? '⏳ Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10001
          }}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
};
