import { useState, useEffect } from 'react';
import type { UserRecord } from '../../types/retailDaddy';
import { api } from '../../api/client';

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
  const [dbHealthy, setDbHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const res = await api.checkHealth();
      setDbHealthy(res.status === 'ok' && res.database === 'healthy');
    } catch {
      setDbHealthy(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', () => setDbHealthy(false));
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', () => setDbHealthy(false));
    };
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
          title="Click to Switch User / Login Panel"
        >
          Logged in As : 👤 {currentUser ? `${currentUser.userType} : ${currentUser.userId}` : (isAdmin ? 'Admin : admin' : 'Sales Person : ashok')}
        </span>
        <span style={{ color: '#93c5fd', fontWeight: 'bold' }}>
          Shree Vinayaka Furnitures ERP • [{companyName}]
        </span>

        {/* Live Cloud Database Health Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
          {isChecking && dbHealthy === null ? (
            <span style={{ color: '#67e8f9', fontWeight: 'bold', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🔄 Connecting to Railway PostgreSQL...
            </span>
          ) : dbHealthy ? (
            <span
              style={{
                color: '#22c55e',
                fontWeight: 'bold',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(34, 197, 94, 0.1)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(34, 197, 94, 0.3)'
              }}
              title="Verified Single Source of Truth: All reads and writes commit to PostgreSQL on Railway"
            >
              🟢 Railway PostgreSQL Online (Live SSOT)
            </span>
          ) : (
            <button
              type="button"
              onClick={checkConnection}
              style={{
                color: '#ef4444',
                fontWeight: 'bold',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(239, 68, 68, 0.15)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                cursor: 'pointer'
              }}
              title="Click to retry connecting to Railway PostgreSQL database"
            >
              🔴 Database Disconnected [Retry]
            </button>
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
