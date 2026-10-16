import React, { useState } from 'react';
import type { UserRecord, UserType } from '../../types/retailDaddy';

interface UserRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserRecord[];
  onSaveUser: (user: UserRecord) => void;
  onUpdateUser: (user: UserRecord) => void;
  onDeleteUser: (userId: string) => void;
}

export const UserRegistrationModal: React.FC<UserRegistrationModalProps> = ({
  isOpen,
  onClose,
  users,
  onSaveUser,
  onUpdateUser,
  onDeleteUser
}) => {
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [userId, setUserId] = useState('');
  const [userType, setUserType] = useState<UserType>('Sales Person');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [signaturePath, setSignaturePath] = useState('');
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [availabilityMsg, setAvailabilityMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClearForm = () => {
    setSelectedUser(null);
    setUserId('');
    setUserType('Sales Person');
    setPassword('');
    setName('');
    setEmail('');
    setContactNo('');
    setIsActive(true);
    setSignaturePath('');
    setPhoto(undefined);
    setAvailabilityMsg(null);
  };

  const handleSelectUser = (u: UserRecord) => {
    setSelectedUser(u);
    setUserId(u.userId);
    setUserType(u.userType);
    setPassword(u.password);
    setName(u.name);
    setEmail(u.email);
    setContactNo(u.contactNo);
    setIsActive(u.isActive);
    setSignaturePath(u.signaturePath || '');
    setPhoto(u.photo);
    setAvailabilityMsg(null);
  };

  const handleCheckAvailability = () => {
    if (!userId.trim()) {
      setAvailabilityMsg('Please enter a User ID first.');
      return;
    }
    const exists = users.some(
      u => u.userId.toLowerCase() === userId.trim().toLowerCase() && u.id !== selectedUser?.id
    );
    if (exists) {
      setAvailabilityMsg('❌ User ID already taken!');
    } else {
      setAvailabilityMsg('✔ User ID is available!');
    }
  };

  const handleSave = () => {
    if (!userId.trim() || !name.trim()) {
      alert('Please fill in both User ID and Name.');
      return;
    }
    const exists = users.some(u => u.userId.toLowerCase() === userId.trim().toLowerCase());
    if (exists) {
      alert(`User ID "${userId}" already exists. Please click Update or use a different User ID.`);
      return;
    }

    const newUser: UserRecord = {
      id: 'u-' + Date.now(),
      userId: userId.trim(),
      userType,
      password: password || '1234',
      name: name.trim(),
      email: email.trim(),
      contactNo: contactNo.trim(),
      isActive,
      signaturePath: signaturePath.trim() || undefined,
      photo,
      registeredDate: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    onSaveUser(newUser);
    handleClearForm();
    alert('User successfully registered!');
  };

  const handleUpdate = () => {
    if (!selectedUser) {
      alert('Please select a user from the table below to update.');
      return;
    }

    const updatedUser: UserRecord = {
      ...selectedUser,
      userId: userId.trim(),
      userType,
      password: password || selectedUser.password,
      name: name.trim(),
      email: email.trim(),
      contactNo: contactNo.trim(),
      isActive,
      signaturePath: signaturePath.trim() || undefined,
      photo
    };

    onUpdateUser(updatedUser);
    handleClearForm();
    alert('User successfully updated!');
  };

  const handleDelete = () => {
    if (!selectedUser) {
      alert('Please select a user to delete.');
      return;
    }
    if (selectedUser.userId.toLowerCase() === 'admin') {
      alert('Root Administrator "admin" cannot be deleted!');
      return;
    }
    if (confirm(`Are you sure you want to delete user "${selectedUser.userId}"?`)) {
      onDeleteUser(selectedUser.userId);
      handleClearForm();
    }
  };

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
          width: '880px',
          maxWidth: '96vw',
          backgroundColor: '#f1f5f9',
          border: '2px solid #0284c7',
          borderRadius: '8px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          fontFamily: 'Segoe UI, Tahoma, sans-serif'
        }}
      >
        {/* Title Bar (Video 11 Frame 0035) */}
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
            <span>👤</span>
            <span>List of Registered Users</span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
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
        </div>

        {/* Modal Content */}
        <div style={{ padding: '16px' }}>
          {/* Top Form Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.8fr 1fr 120px',
              gap: '16px',
              backgroundColor: '#ffffff',
              padding: '14px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              marginBottom: '16px'
            }}
          >
            {/* Col 1: Fields with Light Yellow input backgrounds matching Frame 0035 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ width: '90px', fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                  User ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  placeholder="Enter User ID"
                  style={{
                    flex: 1,
                    padding: '5px 8px',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}
                />
                <button
                  type="button"
                  onClick={handleCheckAvailability}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  ✔ Check Availability
                </button>
              </div>

              {availabilityMsg && (
                <div style={{ marginLeft: '98px', fontSize: '11px', fontWeight: 'bold', color: availabilityMsg.startsWith('✔') ? '#16a34a' : '#dc2626' }}>
                  {availabilityMsg}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ width: '90px', fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                  User Type
                </label>
                <select
                  value={userType}
                  onChange={e => setUserType(e.target.value as UserType)}
                  style={{
                    flex: 1,
                    padding: '5px 8px',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  <option value="Admin">Admin</option>
                  <option value="Sales Person">Sales Person</option>
                  <option value="Inventory Manager">Inventory Manager</option>
                  <option value="Moderator">Moderator</option>
                  <option value="SAdmin">SAdmin</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ width: '90px', fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    flex: 1,
                    padding: '5px 8px',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ width: '90px', fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full Name"
                  style={{
                    flex: 1,
                    padding: '5px 8px',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ width: '90px', fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                  Email ID
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  style={{
                    flex: 1,
                    padding: '5px 8px',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ width: '90px', fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                  Contact No
                </label>
                <input
                  type="text"
                  value={contactNo}
                  onChange={e => setContactNo(e.target.value)}
                  placeholder="Contact Number"
                  style={{
                    flex: 1,
                    padding: '5px 8px',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ width: '90px', fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                  Status
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={e => setIsActive(e.target.checked)}
                    />
                    Active
                  </label>
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: isActive ? '#22c55e' : '#94a3b8',
                      boxShadow: isActive ? '0 0 6px #22c55e' : 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ width: '90px', fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>
                  Signature Path:
                </label>
                <input
                  type="text"
                  value={signaturePath}
                  onChange={e => setSignaturePath(e.target.value)}
                  placeholder="C:\signatures\sig1.png"
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    fontSize: '11px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setSignaturePath('C:\\Users\\admin\\signature.png')}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '3px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Browse
                </button>
                <button
                  type="button"
                  onClick={() => setSignaturePath('')}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#1e293b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '3px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Col 2: Photo Frame matching Frame 0035 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '120px',
                  height: '130px',
                  backgroundColor: '#f8fafc',
                  border: '2px dashed #94a3b8',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                {photo ? (
                  <img src={photo} alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <span style={{ fontSize: '48px', display: 'block' }}>👤</span>
                    <span style={{ fontSize: '10px' }}>User Photo</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                <button
                  type="button"
                  onClick={() => setPhoto('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80')}
                  style={{
                    flex: 1,
                    padding: '4px',
                    backgroundColor: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '3px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Browse...
                </button>
                <button
                  type="button"
                  onClick={() => setPhoto(undefined)}
                  style={{
                    flex: 1,
                    padding: '4px',
                    backgroundColor: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '3px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>OR</span>
              <button
                type="button"
                onClick={() => setPhoto('https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80')}
                style={{
                  width: '100%',
                  padding: '5px',
                  backgroundColor: '#1e40af',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                📷 Use Webcam
              </button>
            </div>

            {/* Col 3: Vertical Action Buttons matching Frame 0035 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={handleClearForm}
                style={{
                  padding: '8px',
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
                onClick={handleSave}
                style={{
                  padding: '8px',
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
                disabled={!selectedUser}
                style={{
                  padding: '8px',
                  backgroundColor: selectedUser ? '#0284c7' : '#94a3b8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: selectedUser ? 'pointer' : 'not-allowed'
                }}
              >
                Update
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!selectedUser}
                style={{
                  padding: '8px',
                  backgroundColor: selectedUser ? '#dc2626' : '#cbd5e1',
                  color: selectedUser ? '#fff' : '#64748b',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: selectedUser ? 'pointer' : 'not-allowed'
                }}
              >
                Delete
              </button>
            </div>
          </div>

          {/* Bottom Table with Red Header (Video 11 Frame 0035) */}
          <div
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              backgroundColor: '#fff',
              border: '1px solid #cbd5e1',
              borderRadius: '4px'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#991b1b', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', borderRight: '1px solid #b91c1c' }}>#</th>
                  <th style={{ padding: '6px 8px', borderRight: '1px solid #b91c1c' }}>User ID</th>
                  <th style={{ padding: '6px 8px', borderRight: '1px solid #b91c1c' }}>User Type</th>
                  <th style={{ padding: '6px 8px', borderRight: '1px solid #b91c1c' }}>Password</th>
                  <th style={{ padding: '6px 8px', borderRight: '1px solid #b91c1c' }}>Name</th>
                  <th style={{ padding: '6px 8px', borderRight: '1px solid #b91c1c' }}>Email ID</th>
                  <th style={{ padding: '6px 8px', borderRight: '1px solid #b91c1c' }}>Contact No</th>
                  <th style={{ padding: '6px 8px', borderRight: '1px solid #b91c1c' }}>Active</th>
                  <th style={{ padding: '6px 8px' }}>Registered Date</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    style={{
                      backgroundColor: selectedUser?.id === u.id ? '#fef08a' : idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      cursor: 'pointer',
                      borderBottom: '1px solid #e2e8f0'
                    }}
                  >
                    <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>{idx + 1}</td>
                    <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#0369a1' }}>{u.userId}</td>
                    <td style={{ padding: '6px 8px' }}>{u.userType}</td>
                    <td style={{ padding: '6px 8px', letterSpacing: '2px' }}>••••••••</td>
                    <td style={{ padding: '6px 8px' }}>{u.name}</td>
                    <td style={{ padding: '6px 8px' }}>{u.email}</td>
                    <td style={{ padding: '6px 8px' }}>{u.contactNo}</td>
                    <td style={{ padding: '6px 8px', fontWeight: 'bold', color: u.isActive ? '#16a34a' : '#dc2626' }}>
                      {u.isActive ? 'Yes' : 'No'}
                    </td>
                    <td style={{ padding: '6px 8px', color: '#64748b' }}>{u.registeredDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
