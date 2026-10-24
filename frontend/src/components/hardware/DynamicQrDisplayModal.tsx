import React, { useState, useEffect } from 'react';
import { dynamicQrService, type DqrPayload, type DqrSerialLog, type DqrHardwareSettings } from '../../services/dynamicQrDisplayService';
import { CustomerFacingQrDisplay } from './CustomerFacingQrDisplay';

interface DynamicQrDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBillAmount?: number;
  currentBillNo?: string;
  customerName?: string;
}

export function DynamicQrDisplayModal({
  isOpen,
  onClose,
  currentBillAmount = 0,
  currentBillNo = '',
  customerName = 'Valued Customer'
}: DynamicQrDisplayModalProps) {
  const [activeTab, setActiveTab] = useState<'PREVIEW_BROADCAST' | 'USB_SERIAL_HARDWARE' | 'SOUNDBOX_VOICE' | 'EVENTUM_GUIDE'>('PREVIEW_BROADCAST');
  const [payload, setPayload] = useState<DqrPayload>(dynamicQrService.getCurrentPayload());
  const [logs, setLogs] = useState<DqrSerialLog[]>([]);
  const [settings, setSettings] = useState<DqrHardwareSettings>(dynamicQrService.getSettings());
  const [customAmount, setCustomAmount] = useState<number>(currentBillAmount || 25000);
  const [customBillNo, setCustomBillNo] = useState<string>(currentBillNo || 'INV-2026-01');
  const [customCustomer, setCustomCustomer] = useState<string>(customerName || 'Customer');
  const [isConnected, setIsConnected] = useState<boolean>(dynamicQrService.isSerialConnected());

  useEffect(() => {
    if (!isOpen) return;
    const unsubPayload = dynamicQrService.subscribe(setPayload);
    const unsubLogs = dynamicQrService.subscribeLogs(setLogs);
    setIsConnected(dynamicQrService.isSerialConnected());
    return () => {
      unsubPayload();
      unsubLogs();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLaunchSecondaryWindow = () => {
    dynamicQrService.openCustomerDisplayWindow();
  };

  const handlePushPaymentPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    dynamicQrService.setPaymentPrompt(customAmount, customBillNo, customCustomer);
  };

  const handlePushPaid = () => {
    dynamicQrService.setPaymentSuccess(`UPI${Date.now().toString().slice(-8)}`);
  };

  const handleResetIdle = () => {
    dynamicQrService.resetToIdle();
  };

  const handleConnectUsb = async () => {
    const success = await dynamicQrService.connectSerialPort();
    setIsConnected(success);
  };

  const handleDisconnectUsb = async () => {
    await dynamicQrService.disconnectSerialPort();
    setIsConnected(false);
  };

  const handleSaveSettings = (updates: Partial<DqrHardwareSettings>) => {
    dynamicQrService.saveSettings(updates);
    setSettings(dynamicQrService.getSettings());
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          width: '1080px',
          maxWidth: '96vw',
          height: '92vh',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #cbd5e1'
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            background: 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)',
            color: '#ffffff',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #eab308'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 10px rgba(234, 179, 8, 0.3)'
              }}
            >
              📱
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: '900', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>Dynamic QR Code Display (DQR) Stand Studio</span>
                <span style={{ fontSize: '10px', background: '#eab308', color: '#78350f', padding: '2px 8px', borderRadius: '12px', fontWeight: '900' }}>
                  ID: 2858609017388
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                Customer-Facing BHIM UPI Payment Stand • Dual-Screen Broadcast • USB Virtual COM Stand
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Quick Status Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '800',
                background: isConnected ? '#064e3b' : '#334155',
                color: isConnected ? '#6ee7b7' : '#94a3b8',
                border: isConnected ? '1px solid #059669' : '1px solid #475569'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isConnected ? '#10b981' : '#64748b' }}></span>
              <span>{isConnected ? 'USB Stand Connected' : 'USB Stand Offline (Dual-Screen Active)'}</span>
            </div>

            <button
              onClick={handleLaunchSecondaryWindow}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
              }}
              title="Open secondary window for customer monitor or pole display stand"
            >
              <span>🖥️</span>
              <span>Pop-Out Customer Screen</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#ffffff',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close Studio [Esc]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', padding: '0 16px' }}>
          {[
            { id: 'PREVIEW_BROADCAST', label: '🖥️ Customer Screen & Broadcast', icon: '📱' },
            { id: 'USB_SERIAL_HARDWARE', label: '🔌 USB Stand (Web Serial API)', icon: '⚡' },
            { id: 'SOUNDBOX_VOICE', label: '🔊 Soundbox Voice Announcements', icon: '📢' },
            { id: 'EVENTUM_GUIDE', label: '📖 DQR Stand Guide (ID: 2858609017388)', icon: 'ℹ️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 18px',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #0284c7' : '3px solid transparent',
                background: 'transparent',
                color: activeTab === tab.id ? '#0284c7' : '#64748b',
                fontWeight: activeTab === tab.id ? '800' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f8fafc' }}>
          {/* ============================================================ */}
          {/* TAB 1: PREVIEW & BROADCAST                                   */}
          {/* ============================================================ */}
          {activeTab === 'PREVIEW_BROADCAST' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '20px', height: '100%' }}>
              {/* Left: Scaled Customer Display Simulation */}
              <div
                style={{
                  background: '#0f172a',
                  borderRadius: '14px',
                  border: '3px solid #334155',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ background: '#1e293b', padding: '8px 14px', fontSize: '11px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Live 1:1 Customer Screen Simulator [Current State: <strong style={{ color: '#38bdf8' }}>{payload.state}</strong>]</span>
                  <span>Amount: ₹{payload.netPay.toFixed(2)}</span>
                </div>
                <div style={{ flex: 1, minHeight: '380px' }}>
                  <CustomerFacingQrDisplay embedded={true} />
                </div>
              </div>

              {/* Right: Cashier Action Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                    ⚡ Instant Customer Stand Controller
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                    Push custom amounts or change payment state directly to the customer-facing DQR stand:
                  </div>

                  <form onSubmit={handlePushPaymentPrompt} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                        Amount to Collect (₹) :
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={customAmount}
                        onChange={e => setCustomAmount(parseFloat(e.target.value) || 0)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '2px solid #0284c7',
                          borderRadius: '6px',
                          fontSize: '18px',
                          fontWeight: '900',
                          color: '#0f172a'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                          Invoice / Ref No :
                        </label>
                        <input
                          type="text"
                          value={customBillNo}
                          onChange={e => setCustomBillNo(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                          Customer Name :
                        </label>
                        <input
                          type="text"
                          value={customCustomer}
                          onChange={e => setCustomCustomer(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button
                        type="submit"
                        style={{
                          flex: 1,
                          background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                          color: '#78350f',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '10px',
                          fontWeight: '900',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>⚡</span>
                        <span>Show Dynamic UPI QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePushPaid}
                        style={{
                          background: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '10px 14px',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                        title="Simulate customer paying successfully"
                      >
                        ✓ Mark Paid
                      </button>
                    </div>
                  </form>
                </div>

                {/* State Trigger Shortcuts */}
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '10px' }}>
                    Quick State Shortcuts:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    <button
                      onClick={handleResetIdle}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#334155',
                        cursor: 'pointer'
                      }}
                    >
                      🌟 Idle Welcome
                    </button>
                    <button
                      onClick={() => dynamicQrService.setBillingState([
                        { name: 'Nilambur Teak Dining Table', qty: 1, rate: 42500, amount: 42500 },
                        { name: 'Cushioned Dining Chair', qty: 4, rate: 3200, amount: 12800 }
                      ], 'INV-8891', 'Ramesh Kumar')}
                      style={{
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: '6px',
                        padding: '8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#166534',
                        cursor: 'pointer'
                      }}
                    >
                      🛒 Test Bill (₹55,300)
                    </button>
                    <button
                      onClick={() => dynamicQrService.testVoiceSoundbox(payload.netPay || 45500)}
                      style={{
                        background: '#fef3c7',
                        border: '1px solid #fde68a',
                        borderRadius: '6px',
                        padding: '8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#92400e',
                        cursor: 'pointer'
                      }}
                    >
                      🔊 Test Voice Alert
                    </button>
                  </div>
                </div>

                {/* Quick Info Box */}
                <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '10px', border: '1px solid #bfdbfe', fontSize: '12px', color: '#1e40af', lineHeight: 1.5 }}>
                  💡 <strong>Dual-Screen Tip:</strong> Click <strong>"Pop-Out Customer Screen"</strong> above to open the customer window on your secondary monitor facing the customer. It automatically updates in real-time as you scan barcodes in POS!
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: USB SERIAL HARDWARE (Web Serial API)                  */}
          {/* ============================================================ */}
          {activeTab === 'USB_SERIAL_HARDWARE' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#ffffff', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                    Physical USB DQR Display Stand Connection
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
                    Connects directly to the Eventum / Sunmi / Pole Display Stand via Chrome Web Serial API (Virtual COM Port CH340 / CP2102).
                  </div>

                  {/* Connect / Disconnect Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    {!isConnected ? (
                      <button
                        onClick={handleConnectUsb}
                        style={{
                          background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '10px 18px',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
                        }}
                      >
                        <span>🔌</span>
                        <span>Connect USB DQR Device</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleDisconnectUsb}
                        style={{
                          background: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '10px 18px',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>✕</span>
                        <span>Disconnect USB Stand</span>
                      </button>
                    )}

                    <div style={{ fontSize: '12px', color: isConnected ? '#16a34a' : '#64748b', fontWeight: 'bold' }}>
                      {isConnected ? '✓ Hardware Connected & Active' : 'Offline / Disconnected'}
                    </div>
                  </div>

                  {/* Configuration Controls */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                        Baud Rate :
                      </label>
                      <select
                        value={settings.baudRate}
                        onChange={e => handleSaveSettings({ baudRate: Number(e.target.value) })}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        <option value={9600}>9600 bps (Standard Pole Display)</option>
                        <option value={19200}>19200 bps</option>
                        <option value={38400}>38400 bps</option>
                        <option value={115200}>115200 bps (Eventum DQR Stand Default)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                        Device Protocol :
                      </label>
                      <select
                        value={settings.deviceProtocol}
                        onChange={e => handleSaveSettings({ deviceProtocol: e.target.value as any })}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        <option value="EVENTUM_JSON">Eventum / TFT DQR (JSON Protocol)</option>
                        <option value="ESCPOS_POLE">ESC/POS 2-Line Customer Pole Display</option>
                        <option value="RAW_TEXT">Raw Pipe Delimited Text</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#0f172a' }}>
                    Hardware Compatibility Note:
                  </div>
                  Supports Eventum Testware DQR Stand (IndiaMART ID 2858609017388), Essae, Sunmi, Posiflex, and standard USB-to-UART bridge controllers (CH340G, CP2102, FTDI FT232R).
                </div>
              </div>

              {/* Live Serial Terminal Console */}
              <div
                style={{
                  background: '#0f172a',
                  color: '#e2e8f0',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  height: '420px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>📟 Serial Output Terminal</span>
                  <span style={{ color: '#64748b' }}>{logs.length} entries</span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {logs.length === 0 ? (
                    <div style={{ color: '#64748b', fontStyle: 'italic', margin: 'auto' }}>
                      No communications yet. Connect port or trigger payment to view logs.
                    </div>
                  ) : (
                    logs.map(log => (
                      <div key={log.id} style={{ display: 'flex', gap: '8px', lineHeight: 1.4 }}>
                        <span style={{ color: '#64748b' }}>[{log.timestamp}]</span>
                        <span
                          style={{
                            fontWeight: 'bold',
                            color:
                              log.type === 'TX'
                                ? '#38bdf8'
                                : log.type === 'RX'
                                ? '#a855f7'
                                : log.type === 'SUCCESS'
                                ? '#4ade80'
                                : log.type === 'ERROR'
                                ? '#f87171'
                                : '#e2e8f0'
                          }}
                        >
                          {log.type}:
                        </span>
                        <span style={{ wordBreak: 'break-all' }}>{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: SOUNDBOX VOICE ANNOUNCEMENT                           */}
          {/* ============================================================ */}
          {activeTab === 'SOUNDBOX_VOICE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '720px' }}>
              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                      📢 Paytm / PhonePe Style Soundbox Voice Alerts
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Speaks payment confirmation in your preferred regional language via showroom counter speakers.
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                    <input
                      type="checkbox"
                      checked={settings.soundboxVoiceEnabled}
                      onChange={e => handleSaveSettings({ soundboxVoiceEnabled: e.target.checked })}
                    />
                    <span>Enable Voice Alerts</span>
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                      Voice Language :
                    </label>
                    <select
                      value={settings.voiceLanguage}
                      onChange={e => handleSaveSettings({ voiceLanguage: e.target.value as any })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 'bold'
                      }}
                    >
                      <option value="en-IN">English (India) - "Received Rs. 45,500 on UPI"</option>
                      <option value="hi-IN">Hindi - "श्री विनायका फर्नीचर्स: यूपीआई पर प्राप्त हुए"</option>
                      <option value="te-IN">Telugu - "శ్రీ వినాయక ఫర్నిచర్స్: యూపీఐ ద్వారా అందాయి"</option>
                      <option value="kn-IN">Kannada - "ಶ್ರೀ ವಿನಾಯಕ ಫರ್ನಿಚರ್ಸ್: ಯುಪಿಐ ಮೂಲಕ ಸ್ವೀಕರಿಸಲಾಗಿದೆ"</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                      Test Voice Soundbox:
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => dynamicQrService.testVoiceSoundbox(1500)}
                        style={{
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        🔊 ₹1,500
                      </button>
                      <button
                        onClick={() => dynamicQrService.testVoiceSoundbox(45500)}
                        style={{
                          background: '#dbeafe',
                          border: '1px solid #93c5fd',
                          color: '#1e40af',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        🔊 ₹45,500
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: EVENTUM HARDWARE GUIDE (ID: 2858609017388)             */}
          {/* ============================================================ */}
          {activeTab === 'EVENTUM_GUIDE' && (
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '850px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                <span style={{ fontSize: '32px' }}>💡</span>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>
                    Dynamic QR Code Display Device Overview (Eventum Testware)
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Product Reference: IndiaMART ID 2858609017388 • Price: ₹2,000 / piece
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '18px', marginBottom: '6px' }}>🚫📶</div>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>Zero Connectivity Costs</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    Operates without any SIM card or monthly internet recharge plan. Connects directly to POS via USB.
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '18px', marginBottom: '6px' }}>🔒</div>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>Bank-Grade Security</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    Zero customer payment or card data is stored on the stand. BHIM UPI standard compliant.
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '18px', marginBottom: '6px' }}>⚡</div>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>Zero Typing Errors</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    Dynamic QR eliminates customer amount entry mistakes. Customers scan and tap Pay without typing the rupees.
                  </div>
                </div>
              </div>

              <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '10px', border: '1px solid #bbf7d0', fontSize: '13px', color: '#166534', lineHeight: 1.6 }}>
                <strong>How to set up in Shree Vinayaka Furnitures Showroom:</strong>
                <ol style={{ paddingLeft: '20px', marginTop: '8px' }}>
                  <li>Place the DQR Stand facing the customer on the billing counter.</li>
                  <li>Plug the USB cable into any free USB port on the billing desktop PC.</li>
                  <li>In this Studio under <strong>"USB Stand"</strong>, click <strong>"Connect USB DQR Device"</strong> and select the port (Baud: 115200).</li>
                  <li>Alternatively, click <strong>"Pop-Out Customer Screen"</strong> on any dual-monitor setup to get the crystal-clear edge-to-edge interactive display immediately!</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
