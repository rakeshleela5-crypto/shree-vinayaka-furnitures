import React, { useState, useEffect } from 'react';
import type { UserControlPermissions, UserRecord } from '../../types/retailDaddy';
import { DEFAULT_USER_PERMISSIONS_ALL } from '../../data/retailDaddyData';

interface UserControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserRecord[];
  userPermissionsMap: Record<string, UserControlPermissions>;
  onUpdatePermissions: (userId: string, perms: UserControlPermissions) => void;
}

export const UserControlModal: React.FC<UserControlModalProps> = ({
  isOpen,
  onClose,
  users,
  userPermissionsMap,
  onUpdatePermissions
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('ashok');
  const [searchUserId, setSearchUserId] = useState<string>('');
  const [currentPerms, setCurrentPerms] = useState<UserControlPermissions>({ ...DEFAULT_USER_PERMISSIONS_ALL });
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (selectedUserId && userPermissionsMap[selectedUserId]) {
      setCurrentPerms({ ...userPermissionsMap[selectedUserId] });
    } else {
      setCurrentPerms({ ...DEFAULT_USER_PERMISSIONS_ALL });
    }
  }, [selectedUserId, userPermissionsMap]);

  if (!isOpen) return null;

  const col1Items: { key: keyof UserControlPermissions; label: string }[] = [
    { key: 'companyInformation', label: 'Company Information' },
    { key: 'saleEntry', label: 'Sale Entry' },
    { key: 'saleReturn', label: 'Sale Return' },
    { key: 'quotation', label: 'Quotation' },
    { key: 'purchaseEntry', label: 'Purchase Entry' },
    { key: 'purchaseReturn', label: 'Purchase Return' },
    { key: 'purchaseOrder', label: 'Purchase Order' },
    { key: 'receipt', label: 'Receipt' },
    { key: 'payment', label: 'Payment' },
    { key: 'income', label: 'Income' },
    { key: 'expense', label: 'Expense' },
    { key: 'estimate', label: 'Estimate' },
    { key: 'productCatalogue', label: 'Product Catalogue' },
    { key: 'gallery', label: 'Gallery' },
    { key: 'autoBackup', label: 'Auto Backup' },
    { key: 'reminderRecord', label: 'Reminder Record' },
    { key: 'logsActivity', label: 'Logs Activity' }
  ];

  const col2Items: { key: keyof UserControlPermissions; label: string }[] = [
    { key: 'bulkEditor', label: 'Bulk Editor' },
    { key: 'customerEntry', label: 'Customer Entry' },
    { key: 'supplierEntry', label: 'Supplier Entry' },
    { key: 'salesManEntry', label: 'Sales Man Entry' },
    { key: 'productEntry', label: 'Product Entry' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'upiQrCode', label: 'UPI QR Code' },
    { key: 'banking', label: 'Banking' },
    { key: 'records', label: 'Records' },
    { key: 'reports', label: 'Reports' },
    { key: 'taxReport', label: 'Tax Report' },
    { key: 'exportImport', label: 'Export / Import' },
    { key: 'contraVoucher', label: 'Contra Voucher' },
    { key: 'offerValidation', label: 'Offer Validation' },
    { key: 'generalBarcode', label: 'General Barcode' },
    { key: 'cipherBarcode', label: 'Cipher Barcode' },
    { key: 'preSufInvoiceCode', label: 'Pre / Suf Invoice Code' }
  ];

  const col3Items: { key: keyof UserControlPermissions; label: string }[] = [
    { key: 'setting', label: 'Setting' },
    { key: 'messenger', label: 'Messenger' },
    { key: 'chequePrint', label: 'Cheque Print' },
    { key: 'mainScrnDashboard', label: 'Main Scrn Dashboard' },
    { key: 'balanceSheet', label: 'Balance Sheet' },
    { key: 'loyaltyManagement', label: 'Loyalty Management' },
    { key: 'service', label: 'Service' },
    { key: 'androidAppMBranch', label: 'Android App+M.Branch' },
    { key: 'journalVoucher', label: 'Journal Voucher' },
    { key: 'damageRecoverItem', label: 'Damage/Recover Item' },
    { key: 'payrollManagement', label: 'Payroll Management' },
    { key: 'cloudBackupMgmt', label: 'Cloud Backup Mgmt' },
    { key: 'virtualCompanyInfo', label: 'Virtual Company Info' },
    { key: 'customerRoute', label: 'Customer Route' },
    { key: 'transporter', label: 'Transporter' },
    { key: 'weightScale', label: 'Weight Scale' },
    { key: 'whatsAppFeature', label: 'WhatsApp Feature' }
  ];

  const handleToggle = (key: keyof UserControlPermissions, val: boolean) => {
    setCurrentPerms(prev => ({ ...prev, [key]: val }));
  };

  const handleUpdate = () => {
    onUpdatePermissions(selectedUserId, currentPerms);
    setStatusMsg(`Permissions for "${selectedUserId}" successfully updated!`);
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const filteredUsers = users.filter(u =>
    u.userId.toLowerCase().includes(searchUserId.toLowerCase())
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999
      }}
    >
      <div
        style={{
          width: '920px',
          maxWidth: '96vw',
          backgroundColor: '#f1f5f9',
          border: '2px solid #1d4ed8',
          borderRadius: '8px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          fontFamily: 'Segoe UI, Tahoma, sans-serif'
        }}
      >
        {/* Title Bar matching Frame 0065 */}
        <div
          style={{
            backgroundColor: '#1d4ed8',
            padding: '8px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#fff',
            fontWeight: '900',
            fontSize: '15px',
            letterSpacing: '1px'
          }}
        >
          <div style={{ margin: '0 auto', textAlign: 'center', width: '100%' }}>
            USER CONTROL
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
              cursor: 'pointer',
              marginLeft: '-24px'
            }}
          >
            ✕
          </button>
        </div>

        {/* 3 Columns Grid matching Video 11 Frame 0065 & 0075 */}
        <div style={{ padding: '12px', maxHeight: '72vh', overflowY: 'auto' }}>
          {statusMsg && (
            <div
              style={{
                padding: '6px 12px',
                marginBottom: '10px',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                textAlign: 'center',
                border: '1px solid #86efac'
              }}
            >
              ✔ {statusMsg}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '12px',
              backgroundColor: '#ffffff',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1'
            }}
          >
            {/* Column 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {col1Items.map((item, idx) => {
                const isEnabled = !!currentPerms[item.key];
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      height: '26px'
                    }}
                  >
                    <span
                      style={{
                        padding: '0 6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#0f172a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        backgroundColor: '#f0fdf4',
                        flex: 1,
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {item.label}
                    </span>
                    <select
                      value={isEnabled ? 'Enable' : 'Disable'}
                      onChange={e => handleToggle(item.key, e.target.value === 'Enable')}
                      style={{
                        width: '78px',
                        height: '100%',
                        backgroundColor: isEnabled ? '#fee2e2' : '#fecaca',
                        color: isEnabled ? '#991b1b' : '#b91c1c',
                        border: 'none',
                        borderLeft: '1px solid #f87171',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Enable">Enable</option>
                      <option value="Disable">Disable</option>
                    </select>
                  </div>
                );
              })}
            </div>

            {/* Column 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {col2Items.map((item, idx) => {
                const isEnabled = !!currentPerms[item.key];
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      height: '26px'
                    }}
                  >
                    <span
                      style={{
                        padding: '0 6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#0f172a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        backgroundColor: '#f0fdf4',
                        flex: 1,
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {item.label}
                    </span>
                    <select
                      value={isEnabled ? 'Enable' : 'Disable'}
                      onChange={e => handleToggle(item.key, e.target.value === 'Enable')}
                      style={{
                        width: '78px',
                        height: '100%',
                        backgroundColor: isEnabled ? '#fee2e2' : '#fecaca',
                        color: isEnabled ? '#991b1b' : '#b91c1c',
                        border: 'none',
                        borderLeft: '1px solid #f87171',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Enable">Enable</option>
                      <option value="Disable">Disable</option>
                    </select>
                  </div>
                );
              })}
            </div>

            {/* Column 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {col3Items.map((item, idx) => {
                const isEnabled = !!currentPerms[item.key];
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      height: '26px'
                    }}
                  >
                    <span
                      style={{
                        padding: '0 6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#0f172a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        backgroundColor: '#f0fdf4',
                        flex: 1,
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {item.label}
                    </span>
                    <select
                      value={isEnabled ? 'Enable' : 'Disable'}
                      onChange={e => handleToggle(item.key, e.target.value === 'Enable')}
                      style={{
                        width: '78px',
                        height: '100%',
                        backgroundColor: isEnabled ? '#fee2e2' : '#fecaca',
                        color: isEnabled ? '#991b1b' : '#b91c1c',
                        border: 'none',
                        borderLeft: '1px solid #f87171',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Enable">Enable</option>
                      <option value="Disable">Disable</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Control Bar matching Video 11 Frame 0065 */}
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          {/* Search By User ID */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>
              Search By User ID :
            </span>
            <input
              type="text"
              value={searchUserId}
              onChange={e => setSearchUserId(e.target.value)}
              placeholder="Type to filter..."
              style={{
                width: '130px',
                padding: '4px 6px',
                fontSize: '11px',
                border: '1px solid #cbd5e1',
                borderRadius: '3px'
              }}
            />
          </div>

          {/* User ID Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>
              User ID :
            </span>
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              style={{
                width: '150px',
                padding: '5px 8px',
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: '#eff6ff',
                border: '1px solid #93c5fd',
                borderRadius: '3px',
                color: '#1d4ed8'
              }}
            >
              {filteredUsers.map(u => (
                <option key={u.id} value={u.userId}>
                  {u.userId} ({u.userType})
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons: New, Save, Update, Delete */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setCurrentPerms({ ...DEFAULT_USER_PERMISSIONS_ALL })}
              style={{
                padding: '6px 14px',
                backgroundColor: '#1e3a8a',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              New
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              style={{
                padding: '6px 14px',
                backgroundColor: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              style={{
                padding: '6px 14px',
                backgroundColor: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Update
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Reset permissions for ${selectedUserId} to default?`)) {
                  setCurrentPerms({ ...DEFAULT_USER_PERMISSIONS_ALL });
                  onUpdatePermissions(selectedUserId, DEFAULT_USER_PERMISSIONS_ALL);
                }
              }}
              style={{
                padding: '6px 14px',
                backgroundColor: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer'
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
