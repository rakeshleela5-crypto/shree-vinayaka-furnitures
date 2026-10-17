import { useState, useEffect } from 'react';
import type { UserRecord } from '../../types/retailDaddy';
import { syncManager, type SyncStatus } from '../../api/syncManager';

interface DesktopStatusBarProps {
  isAdmin: boolean;
  onToggleAdmin: () => void;
  currentUser?: UserRecord;
  companyName?: string;
  onOpenLoginModal?: () => void;
}

export function DesktopStatusBar({
  isAdmin,
  onToggleAdmin,
  currentUser,
  companyName = 'SHREE VINAYAKA FURNITURES',
  onOpenLoginModal
}: DesktopStatusBarProps) {
  const [timeStr, setTimeStr] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => syncManager.getStatus());

  useEffect(() => {
    const unsub = syncManager.subscribe(status => setSyncStatus(status));
    return unsub;
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }) + ' ' + now.toLocaleTimeString('en-US'));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rd-statusbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span
          className="rd-status-user-badge"
          style={{ cursor: 'pointer' }}
          onClick={onOpenLoginModal || onToggleAdmin}
          title="Click to Switch User / Login Panel [Video 11 Frame 0015]"
        >
          Logged in As : 👤 {currentUser ? `${currentUser.userType} : ${currentUser.userId}` : (isAdmin ? 'Admin : admin' : 'Sales Person : ashok')}
        </span>
        <span style={{ color: '#93c5fd', fontWeight: 'bold' }}>
          Shree Vinayaka Furnitures ERP • [{companyName}]
        </span>

        {/* Live Cloud Database & Offline Queue Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
          {syncStatus.isSyncing ? (
            <span style={{ color: '#67e8f9', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🔄 Syncing ({syncStatus.pendingCount})...
            </span>
          ) : syncStatus.pendingCount > 0 ? (
            <button
              type="button"
              style={{
                background: '#ca8a04',
                color: '#ffffff',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '3px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '11px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }}
              onClick={() => syncManager.drainQueue()}
              title="Click to force-sync queued bills to Railway PostgreSQL"
            >
              ⚠️ Offline Queue: {syncStatus.pendingCount} Bills [Sync Now]
            </button>
          ) : syncStatus.isOnline ? (
            <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '11px' }}>
              🟢 Cloud Database Live
            </span>
          ) : (
            <span style={{ color: '#f87171', fontWeight: 'bold', fontSize: '11px' }}>
              🔴 Offline Safe Mode
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span>📞 +91 94484 22354</span>
        <span>✉️ shreevinayakafurnitures@gmail.com</span>
        <span style={{ fontWeight: '700', color: '#fef08a' }}>📅 {timeStr}</span>
      </div>
    </div>
  );
}
