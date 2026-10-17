import React, { useState } from 'react';
import type { UserRecord } from '../../types/retailDaddy';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserRecord[];
  onUpdateUserPassword: (userId: string, newPass: string) => void;
  currentUserId?: string;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  users,
  onUpdateUserPassword,
  currentUserId = 'admin'
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUserId);
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const user = users.find(u => u.userId.toLowerCase() === selectedUserId.toLowerCase());
    if (!user) {
      setMessage({ text: 'Selected user does not exist!', isError: true });
      return;
    }

    if (user.password !== oldPassword) {
      setMessage({ text: 'Old password does not match current password!', isError: true });
      return;
    }

    if (!newPassword.trim()) {
      setMessage({ text: 'Please enter a valid new password!', isError: true });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New password and Confirm password do not match!', isError: true });
      return;
    }

    onUpdateUserPassword(user.userId, newPassword);
    setMessage({ text: `Password for ${user.userId} successfully updated!`, isError: false });
    setTimeout(() => {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage(null);
      onClose();
    }, 1500);
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
          width: '450px',
          backgroundColor: '#f1f5f9',
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
            <span>🔑</span>
            <span>Change Password - Shree Vinayaka Furnitures</span>
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
          {message && (
            <div
              style={{
                padding: '8px 12px',
                marginBottom: '12px',
                borderRadius: '4px',
                backgroundColor: message.isError ? '#fee2e2' : '#dcfce7',
                color: message.isError ? '#b91c1c' : '#15803d',
                fontSize: '13px',
                fontWeight: 'bold',
                border: `1px solid ${message.isError ? '#f87171' : '#86efac'}`
              }}
            >
              {message.text}
            </div>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
              User ID :
            </label>
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                backgroundColor: '#fff',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              {users.map(u => (
                <option key={u.id} value={u.userId}>
                  {u.userId} ({u.name} - {u.userType})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
              Old Password :
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              placeholder="Enter current password"
              required
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

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
              New Password :
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password (e.g. MANGO)"
              required
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

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
              Confirm Password :
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              required
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
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
                backgroundColor: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(22,163,74,0.3)'
              }}
            >
              ✔ Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
