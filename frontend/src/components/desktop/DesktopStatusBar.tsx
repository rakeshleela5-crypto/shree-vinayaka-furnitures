import { useState, useEffect } from 'react';

interface DesktopStatusBarProps {
  isAdmin: boolean;
  onToggleAdmin: () => void;
}

export function DesktopStatusBar({ isAdmin, onToggleAdmin }: DesktopStatusBarProps) {
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
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span
          className="rd-status-user-badge"
          style={{ cursor: 'pointer' }}
          onClick={onToggleAdmin}
          title="Click to toggle Admin / Cashier mode"
        >
          Logged in As : {isAdmin ? 'Admin : admin' : 'Cashier : counter1'}
        </span>
        <span style={{ color: '#93c5fd' }}>Raintech Software Limited</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span>📞 +91 86060 93110</span>
        <span>✉️ raintech7559059967@gmail.com</span>
        <span style={{ fontWeight: '700', color: '#fef08a' }}>📅 {timeStr}</span>
      </div>
    </div>
  );
}
