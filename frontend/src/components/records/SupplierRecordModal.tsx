import React, { useState } from 'react';
import type { OutstandingRecord } from '../../types/retailDaddy';
import { exportToExcel, exportToJson, exportToCsv } from '../../utils/csvImporter';

interface SupplierRecordModalProps {
  isOpen: boolean;
  suppliers: OutstandingRecord[];
  onAddSupplier: (supplier: OutstandingRecord) => void;
  onOpenPayment?: (supplierId: string) => void;
  onDeleteSupplier?: (supplierId: string) => void;
  onClose: () => void;
}

export const SupplierRecordModal: React.FC<SupplierRecordModalProps> = ({
  isOpen,
  suppliers,
  onAddSupplier,
  onOpenPayment,
  onDeleteSupplier,
  onClose
}) => {
  const [searchName, setSearchName] = useState('');
  const [searchContact, setSearchContact] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  // Quick Add Supplier dialog (Video 07 Frames 0055, 0195)
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [name, setName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Kerala');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredSuppliers = suppliers.filter(s => {
    const matchName = searchName ? s.name.toLowerCase().includes(searchName.toLowerCase()) : true;
    const matchContact = searchContact ? s.contactNo.includes(searchContact) : true;
    return matchName && matchContact;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const nextId = `S-${String(suppliers.length + 5).padStart(4, '0')}`;
    const newSupp: OutstandingRecord = {
      id: `supp-${Date.now()}`,
      entityType: 'SUPPLIER',
      code: nextId,
      name: name.trim(),
      contactNo: contactNo.trim() || '9876543210',
      address: address.trim() || 'Industrial Area',
      city: city.trim() || 'Kochi',
      state: state.trim() || 'Kerala',
      totalCredit: 0,
      totalDebit: 0,
      balance: 0
    };

    onAddSupplier(newSupp);
    setShowAddDialog(false);
    setName('');
    setContactNo('');
    setAddress('');
    setCity('');
    showToast(`✓ Supplier "${newSupp.name}" added successfully!`);
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
      <div
        style={{
          width: '95%',
          maxWidth: '1050px',
          height: '88vh',
          maxHeight: '620px',
          backgroundColor: '#f8fafc',
          border: '2px solid #0284c7',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 45px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar Banner */}
        <div
          style={{
            background: 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)',
            color: '#ffffff',
            padding: '5px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #0284c7',
            userSelect: 'none'
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
            List of Suppliers
          </div>
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
          >
            ✕
          </button>
        </div>

        {/* Filter Bar */}
        <div
          style={{
            background: '#ffffff',
            padding: '8px 12px',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
            <div style={{ flex: 1, maxWidth: '250px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
                Search By Supplier Name :
              </label>
              <input
                type="text"
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                placeholder="e.g. Delco, Sundar..."
                style={{ width: '100%', height: '26px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '0 6px', fontSize: '12px' }}
              />
            </div>
            <div style={{ flex: 1, maxWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
                Search By Contact No :
              </label>
              <input
                type="text"
                value={searchContact}
                onChange={e => setSearchContact(e.target.value)}
                placeholder="e.g. 8898..."
                style={{ width: '100%', height: '26px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '0 6px', fontSize: '12px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => {
                setSearchName('');
                setSearchContact('');
              }}
              style={{
                height: '28px',
                padding: '0 12px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: '1px solid #b91c1c',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>

            {/* Export Excel (.xlsx) */}
            <button
              type="button"
              onClick={() => {
                const headers = ['Supplier Code', 'Supplier Name', 'Contact No', 'City', 'State', 'Balance (Credit)'];
                const rows = filteredSuppliers.map(s => [s.code, s.name, s.contactNo || '', s.city || '', s.state || '', s.totalCredit || 0]);
                exportToExcel(`Supplier_Records_${new Date().toISOString().slice(0, 10)}`, headers, rows, 'Suppliers');
                showToast('📊 Export to Excel (.xlsx) completed successfully!');
              }}
              style={{
                height: '28px',
                padding: '0 12px',
                background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
                color: '#ffffff',
                border: '1px solid #15803d',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              title="Export Suppliers to Excel (.xlsx)"
            >
              📊 Excel (.xlsx)
            </button>

            {/* Export JSON (.json) */}
            <button
              type="button"
              onClick={() => {
                exportToJson(`Supplier_Records_${new Date().toISOString().slice(0, 10)}`, filteredSuppliers);
                showToast('📋 Export to JSON (.json) completed successfully!');
              }}
              style={{
                height: '28px',
                padding: '0 12px',
                background: '#475569',
                color: '#ffffff',
                border: '1px solid #334155',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              title="Export Suppliers to JSON (.json)"
            >
              📋 JSON (.json)
            </button>

            {/* Export CSV (.csv) */}
            <button
              type="button"
              onClick={() => {
                const headers = ['Supplier Code', 'Supplier Name', 'Contact No', 'City', 'State', 'Balance (Credit)'];
                const rows = filteredSuppliers.map(s => [s.code, s.name, s.contactNo || '', s.city || '', s.state || '', s.totalCredit || 0]);
                exportToCsv(`Supplier_Records_${new Date().toISOString().slice(0, 10)}`, headers, rows);
                showToast('📄 Export to CSV (.csv) completed successfully!');
              }}
              style={{
                height: '28px',
                padding: '0 10px',
                background: '#2563eb',
                color: '#ffffff',
                border: '1px solid #1d4ed8',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              title="Export Suppliers to CSV (.csv)"
            >
              📄 CSV
            </button>

            <button
              type="button"
              onClick={() => setShowAddDialog(true)}
              style={{
                height: '28px',
                padding: '0 14px',
                background: 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)',
                color: '#ffffff',
                border: '1px solid #1e3a8a',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              + Add Supplier
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#ffffff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: '#003366', color: '#ffffff', textAlign: 'left', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '30px', textAlign: 'center' }}>▷</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '90px' }}>Supplier Code</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', minWidth: '180px' }}>Supplier Name</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', minWidth: '120px' }}>Address</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', minWidth: '90px' }}>City</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', minWidth: '80px' }}>State</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', minWidth: '100px' }}>Contact No.</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '110px', textAlign: 'right' }}>Total Credit</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '110px', textAlign: 'right' }}>Total Debit</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '120px', textAlign: 'right' }}>Current Balance</th>
                <th style={{ padding: '6px 8px', width: '90px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((s, idx) => {
                const isSelected = selectedSupplierId === s.id;
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedSupplierId(s.id)}
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
                    <td style={{ padding: '5px 8px', fontWeight: 'bold', color: '#1e40af' }}>{s.code}</td>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold' }}>{s.name}</td>
                    <td style={{ padding: '5px 8px', color: '#475569' }}>{s.address || '-'}</td>
                    <td style={{ padding: '5px 8px', color: '#475569' }}>{s.city || 'KTM'}</td>
                    <td style={{ padding: '5px 8px', color: '#475569' }}>{s.state || 'Kerala'}</td>
                    <td style={{ padding: '5px 8px', fontWeight: '500' }}>{s.contactNo}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right' }}>₹{s.totalCredit.toFixed(2)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right' }}>₹{s.totalDebit.toFixed(2)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: '900', color: s.balance > 0 ? '#dc2626' : '#166534' }}>
                      ₹{s.balance.toFixed(2)}
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                      {onOpenPayment && (
                        <button
                          type="button"
                          onClick={() => onOpenPayment(s.code)}
                          style={{
                            padding: '2px 8px',
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '2px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          Pay
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
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
            Total Suppliers: <strong>{filteredSuppliers.length}</strong>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {selectedSupplierId && onDeleteSupplier && (
              <button
                type="button"
                onClick={() => {
                  const s = suppliers.find(sup => sup.id === selectedSupplierId || sup.code === selectedSupplierId);
                  if (window.confirm(`Are you sure you want to deactivate and remove supplier "${s?.name || selectedSupplierId}"?`)) {
                    onDeleteSupplier(selectedSupplierId);
                    showToast(`Supplier "${s?.name || selectedSupplierId}" deleted successfully!`);
                    setSelectedSupplierId(null);
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
                  cursor: 'pointer'
                }}
              >
                🗑️ Delete Selected
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

      {/* Add Supplier Dialog */}
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
          <div style={{ width: '400px', backgroundColor: '#ffffff', border: '2px solid #1d4ed8', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ background: '#1d4ed8', color: '#ffffff', padding: '6px 10px', fontSize: '12px', fontWeight: 'bold' }}>
              + Add Supplier
            </div>
            <form onSubmit={handleSave} style={{ padding: '12px' }}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                  Supplier Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Delco Engineering, Sundar Supplier"
                  style={{ width: '100%', height: '26px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '0 6px', fontSize: '12px' }}
                />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                  Contact Number
                </label>
                <input
                  type="text"
                  value={contactNo}
                  onChange={e => setContactNo(e.target.value)}
                  placeholder="e.g. 8898989898"
                  style={{ width: '100%', height: '26px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '0 6px', fontSize: '12px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="e.g. KTM, Vaikom"
                    style={{ width: '100%', height: '26px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '0 6px', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                    State
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    style={{ width: '100%', height: '26px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '0 6px', fontSize: '12px' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. vaikom, Kerala"
                  style={{ width: '100%', height: '26px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '0 6px', fontSize: '12px' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddDialog(false)}
                  style={{ padding: '4px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '4px 16px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '2px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', backgroundColor: '#0f172a', color: '#ffffff', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', zIndex: 10001 }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
};
