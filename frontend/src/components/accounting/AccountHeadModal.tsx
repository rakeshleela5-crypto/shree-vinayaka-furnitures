import React, { useState } from 'react';
import type { AccountHeadItem, AccountHeadGroup } from '../../types/retailDaddy';

interface AccountHeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountHeads: AccountHeadItem[];
  onSaveAccountHead: (head: AccountHeadItem) => void;
  onUpdateAccountHead: (head: AccountHeadItem) => void;
  onDeleteAccountHead: (id: string) => void;
}

const ACCOUNT_GROUPS: AccountHeadGroup[] = [
  'Goods and Services Tax',
  'Statutory Taxes',
  'Expenses (Direct/Indirect)',
  'Fixed Assets',
  'Security & Deposit (Assets)',
  'Loan & Advance (Assets)',
  'Income (Direct/Indirect)',
  'Loan (Liability)',
  'Capital Account'
];

export const AccountHeadModal: React.FC<AccountHeadModalProps> = ({
  isOpen,
  onClose,
  accountHeads,
  onSaveAccountHead,
  onUpdateAccountHead,
  onDeleteAccountHead
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [accountHead, setAccountHead] = useState('');
  const [underGroup, setUnderGroup] = useState<AccountHeadGroup>('Expenses (Direct/Indirect)');
  const [searchGroup, setSearchGroup] = useState('');
  const [searchHead, setSearchHead] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  if (!isOpen) return null;

  const handleRowClick = (item: AccountHeadItem) => {
    setSelectedId(item.id);
    setAccountHead(item.accountHead);
    setUnderGroup(item.underGroup);
  };

  const handleNew = () => {
    setSelectedId(null);
    setAccountHead('');
    setUnderGroup('Expenses (Direct/Indirect)');
  };

  const handleSave = () => {
    if (!accountHead.trim()) {
      showToast('Please enter an Account Head name.', 'error');
      return;
    }
    const newItem: AccountHeadItem = {
      id: `ah-${Date.now()}`,
      accountHead: accountHead.trim().toUpperCase(),
      underGroup
    };
    onSaveAccountHead(newItem);
    showToast(`✓ Saved "${newItem.accountHead}" successfully!`, 'success');
    handleNew();
  };

  const handleUpdate = () => {
    if (!selectedId) {
      showToast('Please select an Account Head to update from the table.', 'error');
      return;
    }
    if (!accountHead.trim()) {
      showToast('Account Head name cannot be empty.', 'error');
      return;
    }
    const updated: AccountHeadItem = {
      id: selectedId,
      accountHead: accountHead.trim().toUpperCase(),
      underGroup
    };
    onUpdateAccountHead(updated);
    showToast(`✓ Updated "${updated.accountHead}" successfully!`, 'success');
  };

  const handleDelete = () => {
    if (!selectedId) {
      showToast('Please select an Account Head from the table to delete.', 'error');
      return;
    }
    onDeleteAccountHead(selectedId);
    showToast(`✓ Deleted Account Head successfully!`, 'success');
    handleNew();
  };

  const filteredHeads = accountHeads.filter(item => {
    const matchGroup = searchGroup === '' || item.underGroup.toLowerCase().includes(searchGroup.toLowerCase());
    const matchHead = searchHead === '' || item.accountHead.toLowerCase().includes(searchHead.toLowerCase());
    return matchGroup && matchHead;
  });

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
        zIndex: 100000,
        backdropFilter: 'blur(3px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '780px',
          maxWidth: '96vw',
          backgroundColor: '#f1f5f9',
          borderRadius: '6px',
          border: '2px solid #0048ba',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Title Bar - Frame 0475 & 0650 */}
        <div
          style={{
            background: 'linear-gradient(180deg, #0052cc 0%, #003366 100%)',
            color: '#ffffff',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
              Account Head
            </div>
            <div style={{ fontSize: '11px', color: '#e0e7ff', marginTop: '1px' }}>
              (Income / Expense / Duties and Taxes)
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#dc2626',
              border: 'none',
              color: '#ffffff',
              width: '26px',
              height: '26px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {toast && (
          <div
            style={{
              padding: '8px 16px',
              backgroundColor: toast.type === 'error' ? '#fee2e2' : toast.type === 'success' ? '#dcfce7' : '#e0f2fe',
              color: toast.type === 'error' ? '#991b1b' : toast.type === 'success' ? '#166534' : '#0369a1',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #cbd5e1'
            }}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: '16px', display: 'flex', gap: '16px' }}>
          {/* Left Form Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Form Fields Box */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ width: '110px', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                  Account Head :
                </label>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    value={accountHead}
                    onChange={e => setAccountHead(e.target.value)}
                    placeholder="e.g. PETROL, SCRAP, WATER BILL"
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      backgroundColor: '#fef9c3', // Retail Daddy pale yellow
                      border: '1px solid #eab308',
                      borderRadius: '3px',
                      outline: 'none',
                      color: '#0f172a'
                    }}
                  />
                  {!accountHead && (
                    <span
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#ef4444',
                        fontWeight: 'bold'
                      }}
                    >
                      *
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ width: '110px', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                  Under Group :
                </label>
                <select
                  value={underGroup}
                  onChange={e => setUnderGroup(e.target.value as AccountHeadGroup)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    fontSize: '13px',
                    fontWeight: 500,
                    backgroundColor: '#ffffff',
                    border: '1px solid #94a3b8',
                    borderRadius: '3px',
                    outline: 'none',
                    color: '#0f172a'
                  }}
                >
                  {ACCOUNT_GROUPS.map(g => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Controls - Frame 0650 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '10px'
              }}
            >
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>
                  Search By Group :
                </label>
                <input
                  type="text"
                  value={searchGroup}
                  onChange={e => setSearchGroup(e.target.value)}
                  placeholder="Filter groups..."
                  style={{
                    width: '100%',
                    padding: '5px 8px',
                    fontSize: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>
                  Search By Account Head :
                </label>
                <input
                  type="text"
                  value={searchHead}
                  onChange={e => setSearchHead(e.target.value)}
                  placeholder="Filter account heads..."
                  style={{
                    width: '100%',
                    padding: '5px 8px',
                    fontSize: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Account Heads Table - Frame 0475 & 0650 */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #003366',
                borderRadius: '4px',
                overflow: 'hidden',
                maxHeight: '260px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1.2fr 1.5fr',
                  backgroundColor: '#003366',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  padding: '7px 8px'
                }}
              >
                <div>#</div>
                <div>A/c Head</div>
                <div>Under Group</div>
              </div>

              <div style={{ overflowY: 'auto', maxHeight: '220px' }}>
                {filteredHeads.map((item, index) => {
                  const isSelected = selectedId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1.2fr 1.5fr',
                        padding: '6px 8px',
                        fontSize: '12px',
                        borderBottom: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#fef08a' : index % 2 === 0 ? '#ffffff' : '#f8fafc',
                        color: isSelected ? '#000000' : '#1e293b',
                        fontWeight: isSelected ? 'bold' : 500,
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {isSelected && <span style={{ color: '#dc2626', fontSize: '10px' }}>▷</span>}
                        <span>{index + 1}</span>
                      </div>
                      <div>{item.accountHead}</div>
                      <div style={{ color: isSelected ? '#000000' : '#475569' }}>{item.underGroup}</div>
                    </div>
                  );
                })}
                {filteredHeads.length === 0 && (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                    No matching account heads found.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Sidebar - Frame 0475 */}
          <div style={{ width: '110px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={handleNew}
              style={{
                padding: '9px 12px',
                backgroundColor: '#1e3a8a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              New
            </button>

            <button
              onClick={handleSave}
              style={{
                padding: '9px 12px',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              Save
            </button>

            <button
              onClick={handleUpdate}
              style={{
                padding: '9px 12px',
                backgroundColor: '#475569',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              Update
            </button>

            <button
              onClick={handleDelete}
              style={{
                padding: '9px 12px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
