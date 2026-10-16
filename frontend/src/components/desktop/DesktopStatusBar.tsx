import { useState, useEffect } from 'react';
import type { UserRecord } from '../../types/retailDaddy';

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
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span>📞 +91 94484 22354</span>
        <span>✉️ shreevinayakafurnitures@gmail.com</span>
        <span style={{ fontWeight: '700', color: '#fef08a' }}>📅 {timeStr}</span>
      </div>
    </div>
  );
}
