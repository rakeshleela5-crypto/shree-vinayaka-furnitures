import { useState, useEffect, useCallback } from 'react';
import {
  getDeadLetterQueue,
  getSyncHealthState,
  retryAllDeadLetters,
  exportDeadLetterJson,
  clearResolvedDeadLetters,
  removeDeadLetterItem,
  getTerminalId,
  type DeadLetterItem,
  type SyncHealthState
} from '../../services/telemetry';

export function SyncHealthIndicator() {
  const [health, setHealth] = useState<SyncHealthState>(getSyncHealthState);
  const [queue, setQueue] = useState<DeadLetterItem[]>(getDeadLetterQueue);
  const [isOpen, setIsOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const refreshState = useCallback(() => {
    setHealth(getSyncHealthState());
    setQueue(getDeadLetterQueue());
  }, []);

  useEffect(() => {
    refreshState();

    const handleHealthUpdate = () => refreshState();
    window.addEventListener('svf-sync-health-updated', handleHealthUpdate);
    window.addEventListener('online', handleHealthUpdate);
    window.addEventListener('offline', handleHealthUpdate);

    const interval = setInterval(refreshState, 8000); // Poll every 8s

    return () => {
      window.removeEventListener('svf-sync-health-updated', handleHealthUpdate);
      window.removeEventListener('online', handleHealthUpdate);
      window.removeEventListener('offline', handleHealthUpdate);
      clearInterval(interval);
    };
  }, [refreshState]);

  const handleRetryAll = async () => {
    setIsRetrying(true);
    setActionFeedback('Replaying offline dead-letter queue...');
    try {
      const res = await retryAllDeadLetters();
      refreshState();
      setActionFeedback(`✓ Replay finished: ${res.replayed} resolved, ${res.failed} remaining`);
    } catch {
      setActionFeedback('❌ Replay encountered an error');
    } finally {
      setIsRetrying(false);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleExport = () => {
    exportDeadLetterJson();
    setActionFeedback('✓ Exported disaster-recovery backup file');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleClearResolved = () => {
    clearResolvedDeadLetters();
    refreshState();
    setActionFeedback('✓ Cleared resolved records');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleDismissItem = (id: string) => {
    removeDeadLetterItem(id);
    refreshState();
  };

  const activeDeadLetters = queue.filter(q => q.status !== 'RESOLVED');
  const hasErrors = activeDeadLetters.length > 0;
  const terminalId = getTerminalId();

  return (
    <>
      {/* Subtle Header Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title={`Sync & Telemetry Health: ${health.isOnline ? 'Online' : 'Offline'} (${activeDeadLetters.length} Dead-Letter Issues)`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 9px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 700,
          cursor: 'pointer',
          border: hasErrors ? '1px solid #ef4444' : health.isOnline ? '1px solid #10b981' : '1px solid #f59e0b',
          background: hasErrors ? '#fee2e2' : health.isOnline ? '#ecfdf5' : '#fef3c7',
          color: hasErrors ? '#991b1b' : health.isOnline ? '#065f46' : '#92400e',
          transition: 'all 0.2s ease',
          boxShadow: hasErrors ? '0 0 8px rgba(239, 68, 68, 0.4)' : 'none'
        }}
      >
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: hasErrors ? '#ef4444' : health.isOnline ? '#10b981' : '#f59e0b',
            display: 'inline-block',
            animation: hasErrors ? 'pulse 1.5s infinite' : 'none'
          }}
        />
        <span>
          {hasErrors
            ? `${activeDeadLetters.length} Stuck Sync${activeDeadLetters.length > 1 ? 's' : ''}`
            : health.isOnline
            ? 'Sync Live'
            : 'Offline Mode'}
        </span>
      </button>

      {/* Slide-over Modal / Drawer */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backdropFilter: 'blur(3px)'
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
              border: '1px solid #cbd5e1',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(90deg, #064e3b 0%, #065f46 100%)',
              color: '#ffffff',
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚡</span> Showroom Telemetry & Dead-Letter Health
                </div>
                <div style={{ fontSize: '11px', color: '#a7f3d0', marginTop: '2px' }}>
                  Terminal ID: <b>{terminalId}</b> • {health.isOnline ? '🟢 Connected to Cloud' : '🟠 Offline Mode'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Quick Status Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              padding: '16px 20px 12px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Network Link</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: health.isOnline ? '#059669' : '#d97706', marginTop: '3px' }}>
                  {health.isOnline ? 'Online (Real-time)' : 'Offline (Local Only)'}
                </div>
              </div>
              <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Dead-Letter Queue</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: hasErrors ? '#dc2626' : '#059669', marginTop: '3px' }}>
                  {activeDeadLetters.length} Unresolved
                </div>
              </div>
              <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Captured</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#334155', marginTop: '3px' }}>
                  {queue.length} Telemetry Events
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{
              padding: '12px 20px',
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
              alignItems: 'center',
              borderBottom: '1px solid #e2e8f0',
              background: '#ffffff'
            }}>
              <button
                type="button"
                onClick={handleRetryAll}
                disabled={isRetrying || activeDeadLetters.length === 0}
                style={{
                  background: activeDeadLetters.length > 0 ? '#059669' : '#94a3b8',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: activeDeadLetters.length > 0 && !isRetrying ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🔄</span> {isRetrying ? 'Retrying Syncs...' : 'Retry Failed Syncs'}
              </button>

              <button
                type="button"
                onClick={handleExport}
                style={{
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>📥</span> Export Dead-Letter JSON
              </button>

              <button
                type="button"
                onClick={handleClearResolved}
                style={{
                  background: 'transparent',
                  color: '#64748b',
                  border: 'none',
                  padding: '6px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🧹 Clear Resolved
              </button>

              {actionFeedback && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', marginLeft: 'auto' }}>
                  {actionFeedback}
                </span>
              )}
            </div>

            {/* Dead Letter Records List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: '#f8fafc' }}>
              {queue.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748b' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>✓</div>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>All Showroom Syncs Operational</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    No failed mutations, unhandled exceptions, or dead-letter items queued.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {queue.map(item => (
                    <div
                      key={item.id}
                      style={{
                        background: '#ffffff',
                        border: item.status === 'RESOLVED' ? '1px solid #e2e8f0' : '1px solid #fecaca',
                        borderLeft: item.status === 'RESOLVED' ? '4px solid #10b981' : '4px solid #ef4444',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: item.severity === 'CRITICAL' ? '#ef4444' : item.severity === 'ERROR' ? '#f97316' : '#e2e8f0',
                              color: item.severity === 'CRITICAL' || item.severity === 'ERROR' ? '#ffffff' : '#334155'
                            }}>
                              {item.severity}
                            </span>
                            <span style={{ fontWeight: 800, color: '#0f172a' }}>{item.eventType}</span>
                            {item.reference && (
                              <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                                #{item.reference}
                              </span>
                            )}
                          </div>
                          <div style={{ color: '#475569', marginTop: '4px', fontSize: '11px', wordBreak: 'break-word' }}>
                            {item.reason}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDismissItem(item.id)}
                            title="Dismiss record"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '2px 4px'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '10px 20px',
              background: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px',
              color: '#64748b'
            }}>
              <div>
                Auto-sync retry runs continuously when online. Local backups stored in IndexedDB/Storage.
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: '#e2e8f0',
                  color: '#1e293b',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
