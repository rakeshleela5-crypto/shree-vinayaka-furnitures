import { useState } from 'react';
import type { TerminalConfig, TillRecord } from '../../types/retailDaddy';

interface TerminalSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TerminalConfig;
  onSaveConfig: (cfg: TerminalConfig) => void;
  tills: TillRecord[];
  onSaveTill: (till: TillRecord) => void;
  onDeleteTill: (id: string) => void;
  onOpenTemplateEditor?: () => void;
}

export function TerminalSettingModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  tills,
  onSaveTill,
  onDeleteTill,
  onOpenTemplateEditor
}: TerminalSettingModalProps) {
  const [formData, setFormData] = useState<TerminalConfig>(config);
  const [selectedTillId, setSelectedTillId] = useState<string>(tills[0]?.id || 'till-1');
  const [statusMsg, setStatusMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSelectTill = (till: TillRecord) => {
    setSelectedTillId(till.id);
    setFormData(prev => ({
      ...prev,
      terminalId: till.tillId,
      printerName: till.printerName,
      invoiceTemplate: (till.invoiceTemplate as any) || prev.invoiceTemplate
    }));
    setStatusMsg(`Selected Terminal: ${till.tillId}`);
  };

  const handleSave = () => {
    onSaveConfig(formData);
    // update or add till record
    const existing = tills.find(t => t.id === selectedTillId || t.tillId === formData.terminalId);
    if (existing) {
      onSaveTill({
        ...existing,
        tillId: formData.terminalId,
        printerName: formData.printerName,
        invoiceTemplate: formData.invoiceTemplate
      });
    } else {
      onSaveTill({
        id: 'till-' + Date.now(),
        tillId: formData.terminalId,
        printerName: formData.printerName,
        invoiceTemplate: formData.invoiceTemplate
      });
    }
    setStatusMsg('Terminal configuration saved successfully!');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleNew = () => {
    setFormData({
      terminalId: 'DESKTOP-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      printerName: 'XP-80C (copy 1)',
      invoiceTemplate: 'Thermal Printer',
      cashDrawerActive: true,
      weightMachinePort: 'COM1',
      weightMachineActive: false,
      customerDisplayPort: 'COM2',
      customerDisplayActive: false,
      customerSecondaryDisplay: false,
      secondaryBaudRate: '9600',
      qrDisplayPort: 'COM3',
      qrDisplayActive: false,
      upiId: config.upiId || '56149501@ubin',
      brandName: config.brandName || 'SHREE VINAYAKA FURNITURES',
      showMenuItemImages: true
    });
    setSelectedTillId('');
    setStatusMsg('New Terminal record created. Enter details and click Save.');
  };

  const handleDelete = () => {
    if (selectedTillId) {
      onDeleteTill(selectedTillId);
      setStatusMsg('Terminal deleted.');
      if (tills.length > 1) {
        const next = tills.find(t => t.id !== selectedTillId);
        if (next) handleSelectTill(next);
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <div style={{
        width: '580px',
        maxWidth: '96vw',
        maxHeight: '92vh',
        background: '#f1f5f9',
        border: '2px solid #1e3a8a',
        borderRadius: '3px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Title Bar (Frame 0065) */}
        <div style={{
          background: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%)',
          color: '#ffffff',
          padding: '6px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 'bold',
          fontSize: '13px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🖥️</span>
            <span>Terminal Setting</span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={onClose}
              style={{
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                width: '24px',
                height: '20px',
                lineHeight: '18px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '12px 16px', fontSize: '11px', color: '#1e293b', flex: 1, overflowY: 'auto' }}>
          {statusMsg && (
            <div style={{
              background: '#dcfce7',
              color: '#15803d',
              padding: '4px 8px',
              border: '1px solid #86efac',
              borderRadius: '2px',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
              ✓ {statusMsg}
            </div>
          )}

          <div style={{ display: 'flex', gap: '14px' }}>
            {/* Left Inputs Column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Terminal ID */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '130px', fontWeight: 'bold' }}>Terminal ID :</span>
                <input
                  type="text"
                  value={formData.terminalId}
                  onChange={e => setFormData({ ...formData, terminalId: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '3px 6px',
                    background: '#fef9c3',
                    border: '1px solid #94a3b8',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                />
              </div>

              {/* Printer Name */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '130px', fontWeight: 'bold' }}>Printer Name :</span>
                <select
                  value={formData.printerName}
                  onChange={e => setFormData({ ...formData, printerName: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '3px 6px',
                    background: '#fef9c3',
                    border: '1px solid #94a3b8',
                    fontSize: '11px'
                  }}
                >
                  <option value="XP-80C (copy 1)">XP-80C (copy 1)</option>
                  <option value="XP-80C">XP-80C</option>
                  <option value="POS-80C Thermal Printer">POS-80C Thermal Printer</option>
                  <option value="EPSON TM-T82 Receipt">EPSON TM-T82 Receipt</option>
                  <option value="Canon LBP2900 A4 Laser">Canon LBP2900 A4 Laser</option>
                  <option value="HP LaserJet Pro MFP">HP LaserJet Pro MFP</option>
                  <option value="\\\\Server\\SharedXP80">\\\\Server\\SharedXP80</option>
                </select>
              </div>

              {/* Invoice Template Type */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '130px', fontWeight: 'bold' }}>Invoice Template Type :</span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <select
                    value={formData.invoiceTemplate}
                    onChange={e => setFormData({ ...formData, invoiceTemplate: e.target.value as any })}
                    style={{
                      flex: 1,
                      padding: '3px 6px',
                      background: '#ffffff',
                      border: '1px solid #94a3b8',
                      fontSize: '11px'
                    }}
                  >
                    <option value="Thermal Printer">Thermal Printer</option>
                    <option value="A4 GST Tax Invoice (Pink Band)">A4 GST Tax Invoice (Pink Band)</option>
                    <option value="A4/A5 Standard GST Invoice">A4/A5 Standard GST Invoice</option>
                    <option value="Quotation Format">Quotation Format</option>
                  </select>
                  <span
                    style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: '15px',
                      height: '15px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}
                    title="Required Template Configuration"
                  >
                    !
                  </span>
                </div>
              </div>

              {/* Red Network Path Note */}
              <div style={{
                color: '#b91c1c',
                fontSize: '9.5px',
                lineHeight: '1.3',
                margin: '2px 0 4px 0',
                padding: '3px 6px',
                background: '#fee2e2',
                border: '1px solid #fecaca'
              }}>
                <strong>Note :</strong> If printer is shared on network then use network path of shared printer as printer name. Expmale : \\ServerName\PrinterName
              </div>

              {/* Cash Drawer Active Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '2px 0' }}>
                <input
                  type="checkbox"
                  id="cashDrawerActive"
                  checked={formData.cashDrawerActive}
                  onChange={e => setFormData({ ...formData, cashDrawerActive: e.target.checked })}
                />
                <label htmlFor="cashDrawerActive" style={{ fontWeight: 'bold', cursor: 'pointer' }}>
                  Cash Drawer Active (Yes / No)
                </label>
              </div>
            </div>

            {/* Right Buttons Column (Frame 0065) */}
            <div style={{ width: '90px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                onClick={handleNew}
                style={{
                  background: 'linear-gradient(180deg, #1e40af 0%, #172554 100%)',
                  color: '#ffffff',
                  border: '1px solid #1e3a8a',
                  padding: '5px 0',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}
              >
                New
              </button>

              <button
                onClick={handleSave}
                style={{
                  background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
                  color: '#ffffff',
                  border: '1px solid #0f172a',
                  padding: '5px 0',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>

              <button
                onClick={handleSave}
                style={{
                  background: 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)',
                  color: '#ffffff',
                  border: '1px solid #1e40af',
                  padding: '5px 0',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}
              >
                Update
              </button>

              <button
                onClick={handleDelete}
                style={{
                  background: 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)',
                  color: '#ffffff',
                  border: '1px solid #b91c1c',
                  padding: '5px 0',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>

              {/* Template Editor Button */}
              <button
                onClick={() => {
                  if (onOpenTemplateEditor) onOpenTemplateEditor();
                  onClose();
                }}
                style={{
                  marginTop: '4px',
                  background: 'linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%)',
                  color: '#ffffff',
                  border: '1px solid #1e40af',
                  padding: '6px 2px',
                  fontWeight: 'bold',
                  fontSize: '10px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                Template Editor
              </button>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #cbd5e1', margin: '8px 0' }} />

          {/* Hardware Device Ports Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {/* Weight Machine PORT */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '130px', fontWeight: 'bold' }}>Weight Machine PORT :</span>
              <select
                value={formData.weightMachinePort}
                onChange={e => setFormData({ ...formData, weightMachinePort: e.target.value })}
                style={{ width: '130px', padding: '2px 4px', background: '#fef9c3', border: '1px solid #94a3b8', fontSize: '11px' }}
              >
                <option value="COM1">COM1</option>
                <option value="COM2">COM2</option>
                <option value="COM3">COM3</option>
                <option value="COM4">COM4</option>
                <option value="USB_SCALE">USB_SCALE</option>
              </select>
              <span style={{ marginLeft: '12px', fontWeight: 'bold' }}>Active :</span>
              <select
                value={formData.weightMachineActive ? 'Yes' : 'No'}
                onChange={e => setFormData({ ...formData, weightMachineActive: e.target.value === 'Yes' })}
                style={{ width: '60px', padding: '2px 4px', border: '1px solid #94a3b8', fontSize: '11px' }}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {/* Customer Display PORT */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '130px', fontWeight: 'bold' }}>Customer Display PORT :</span>
              <select
                value={formData.customerDisplayPort}
                onChange={e => setFormData({ ...formData, customerDisplayPort: e.target.value })}
                style={{ width: '130px', padding: '2px 4px', background: '#fef9c3', border: '1px solid #94a3b8', fontSize: '11px' }}
              >
                <option value="COM1">COM1</option>
                <option value="COM2">COM2</option>
                <option value="COM3">COM3</option>
                <option value="VFD_DISPLAY">VFD_DISPLAY</option>
              </select>
              <span style={{ marginLeft: '12px', fontWeight: 'bold' }}>Active :</span>
              <select
                value={formData.customerDisplayActive ? 'Yes' : 'No'}
                onChange={e => setFormData({ ...formData, customerDisplayActive: e.target.value === 'Yes' })}
                style={{ width: '60px', padding: '2px 4px', border: '1px solid #94a3b8', fontSize: '11px' }}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {/* Customer Secondary Monitor Display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '220px', fontWeight: 'bold' }}>Customer Secondary Monitor Display (Yes / No) :</span>
              <select
                value={formData.customerSecondaryDisplay ? 'Yes' : 'No'}
                onChange={e => setFormData({ ...formData, customerSecondaryDisplay: e.target.value === 'Yes' })}
                style={{ width: '60px', padding: '2px 4px', border: '1px solid #94a3b8', fontSize: '11px' }}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
              <span style={{ marginLeft: '12px', fontWeight: 'bold' }}>Baud Rate :</span>
              <input
                type="text"
                value={formData.secondaryBaudRate}
                onChange={e => setFormData({ ...formData, secondaryBaudRate: e.target.value })}
                style={{ width: '60px', padding: '2px 4px', border: '1px solid #94a3b8', fontSize: '11px' }}
              />
            </div>

            {/* QR Display PORT */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '130px', fontWeight: 'bold' }}>QR Display PORT :</span>
              <select
                value={formData.qrDisplayPort}
                onChange={e => setFormData({ ...formData, qrDisplayPort: e.target.value })}
                style={{ width: '130px', padding: '2px 4px', border: '1px solid #94a3b8', fontSize: '11px' }}
              >
                <option value="COM3">COM3</option>
                <option value="COM4">COM4</option>
                <option value="COM5">COM5</option>
              </select>
              <span style={{ marginLeft: '12px', fontWeight: 'bold' }}>Active :</span>
              <select
                value={formData.qrDisplayActive ? 'Yes' : 'No'}
                onChange={e => setFormData({ ...formData, qrDisplayActive: e.target.value === 'Yes' })}
                style={{ width: '60px', padding: '2px 4px', border: '1px solid #94a3b8', fontSize: '11px' }}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {/* UPI ID & Brand Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
              <span style={{ width: '70px', fontWeight: 'bold' }}>UPI ID :</span>
              <input
                type="text"
                value={formData.upiId}
                onChange={e => setFormData({ ...formData, upiId: e.target.value })}
                style={{
                  width: '170px',
                  padding: '3px 6px',
                  background: '#1d4ed8',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  border: '1px solid #1e3a8a',
                  fontSize: '11px'
                }}
              />
              <span style={{ fontWeight: 'bold' }}>Brand Name :</span>
              <input
                type="text"
                value={formData.brandName}
                onChange={e => setFormData({ ...formData, brandName: e.target.value })}
                style={{ flex: 1, padding: '3px 6px', border: '1px solid #94a3b8', fontSize: '11px' }}
              />
            </div>

            {/* Show Menu Item Images in POS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <input
                type="checkbox"
                id="showMenuItemImages"
                checked={formData.showMenuItemImages}
                onChange={e => setFormData({ ...formData, showMenuItemImages: e.target.checked })}
              />
              <label htmlFor="showMenuItemImages" style={{ fontWeight: 'bold', cursor: 'pointer' }}>
                Show Menu Item Images in POS
              </label>
            </div>
          </div>

          {/* Bottom Till Table (Frame 0065) */}
          <div style={{ marginTop: '10px', border: '1px solid #94a3b8', background: '#ffffff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#1e3a8a', color: '#ffffff', textAlign: 'left' }}>
                  <th style={{ width: '25px', padding: '4px', textAlign: 'center' }}></th>
                  <th style={{ padding: '4px 8px', borderRight: '1px solid #3b82f6' }}>Till ID</th>
                  <th style={{ padding: '4px 8px', borderRight: '1px solid #3b82f6' }}>Printer Name</th>
                  <th style={{ padding: '4px 8px' }}>Invoice Template</th>
                </tr>
              </thead>
              <tbody>
                {tills.map(till => {
                  const isSelected = till.id === selectedTillId || till.tillId === formData.terminalId;
                  return (
                    <tr
                      key={till.id}
                      onClick={() => handleSelectTill(till)}
                      style={{
                        background: isSelected ? '#fed7aa' : '#ffffff',
                        cursor: 'pointer',
                        borderBottom: '1px solid #e2e8f0',
                        fontWeight: isSelected ? 'bold' : 'normal'
                      }}
                    >
                      <td style={{ textAlign: 'center', color: '#dc2626', fontSize: '12px' }}>
                        {isSelected ? '▶' : ''}
                      </td>
                      <td style={{ padding: '4px 8px', borderRight: '1px solid #e2e8f0' }}>{till.tillId}</td>
                      <td style={{ padding: '4px 8px', borderRight: '1px solid #e2e8f0' }}>{till.printerName}</td>
                      <td style={{ padding: '4px 8px' }}>{till.invoiceTemplate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
