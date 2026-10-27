import React, { useState, useEffect, useRef } from 'react';
import {
  DoorOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Truck,
  Barcode,
  Clock,
  X,
  ShieldCheck
} from 'lucide-react';
import type { OldBillRecord, Product, CompanyInfo } from '../../types/retailDaddy';
import { hardwareScanner } from '../../services/hardwareScannerService';
import { api } from '../../api/client';

export interface OutwardExitRecord {
  id: string;
  exitTimestamp: string;
  gatePassNo: string;
  invoiceNo: string;
  customerName: string;
  customerPhone?: string;
  exitChannel: 'CASH_AND_CARRY' | 'TRUCK_DISPATCH';
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  amountPaid: number;
  balanceDue: number;
  items: Array<{ name: string; qty: number; barcode?: string; rate: number }>;
  vehicleNo?: string;
  driverName?: string;
  gatekeeperName: string;
  notes?: string;
}

interface OutwardExitScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bills: OldBillRecord[];
  products: Product[];
  companyInfo?: CompanyInfo;
  gatekeeperName?: string;
}

export const OutwardExitScannerModal: React.FC<OutwardExitScannerModalProps> = ({
  isOpen,
  onClose,
  bills = [],
  products = [],
  companyInfo,
  gatekeeperName = 'Store Security Officer'
}) => {
  const [activeTab, setActiveTab] = useState<'SCAN' | 'AUDIT_LOG' | 'VEHICLES'>('SCAN');
  const [scanQuery, setScanQuery] = useState('');
  const [selectedBill, setSelectedBill] = useState<OldBillRecord | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    'IDLE' | 'VERIFIED_READY' | 'ALREADY_EXITED' | 'PAYMENT_PENDING' | 'NOT_FOUND'
  >('IDLE');
  const [existingExitRecord, setExistingExitRecord] = useState<OutwardExitRecord | null>(null);

  // Vehicle Gate Pass Extra Fields
  const [vehicleNo, setVehicleNo] = useState('KL-05-AR-4491');
  const [driverName, setDriverName] = useState('Biju Kumar');
  const [exitNotes, setExitNotes] = useState('Physical check verified. All furniture boxes accounted for.');
  const [autoAuthorizeOnScan, setAutoAuthorizeOnScan] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audit Log State from PostgreSQL Backend
  const [exitLogs, setExitLogs] = useState<OutwardExitRecord[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch verified outward gate passes from PostgreSQL on open
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    api.getOutwardGatePasses(200).then(data => {
      if (!isMounted || !Array.isArray(data)) return;
      const mapped: OutwardExitRecord[] = data.map((d: any) => {
        let parsedItems = [];
        try {
          parsedItems = d.items_json ? JSON.parse(d.items_json) : [];
        } catch {
          parsedItems = [];
        }
        return {
          id: String(d.id),
          exitTimestamp: d.exit_timestamp ? new Date(d.exit_timestamp).toLocaleString('en-IN') : new Date().toLocaleString('en-IN'),
          gatePassNo: d.gate_pass_no,
          invoiceNo: d.invoice_no || '',
          customerName: d.customer_name,
          customerPhone: d.customer_phone,
          exitChannel: d.exit_channel || 'CASH_AND_CARRY',
          paymentStatus: d.payment_status || 'PAID',
          amountPaid: Number(d.amount_paid || 0),
          balanceDue: Number(d.balance_due || 0),
          items: parsedItems,
          vehicleNo: d.vehicle_no,
          driverName: d.driver_name,
          gatekeeperName: d.gatekeeper_name || 'Security Desk #1',
          notes: d.notes
        };
      });
      setExitLogs(mapped);
    }).catch(err => {
      console.warn("Error fetching outward gate passes from PostgreSQL:", err);
    });
    return () => { isMounted = false; };
  }, [isOpen]);


  // Web Audio sound feedback
  const playAudioTone = (type: 'success' | 'warning' | 'error') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'success') {
        // High ascending pleasant chime (C5 -> E5 -> G5)
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'warning') {
        // Double amber pulse
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.setValueAtTime(0.01, now + 0.15);
        gain.gain.setValueAtTime(0.25, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
        osc.start(now);
        osc.stop(now + 0.38);
      } else {
        // Low error buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch {}
  };

  // Focus search input when modal opens or tab changes to SCAN
  useEffect(() => {
    if (isOpen && activeTab === 'SCAN') {
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 100);
    }
  }, [isOpen, activeTab]);

  // Subscribe to Brontix Desktop Barcode Scanner
  useEffect(() => {
    if (!isOpen) return;

    const cleanup = hardwareScanner.subscribe((detail) => {
      const clean = detail.barcode.trim();
      if (!clean) return;
      setScanQuery(clean);
      handleResolveQuery(clean);
    });

    return () => cleanup();
  }, [isOpen, bills, products, exitLogs]);

  // Keyboard shortcuts (Escape, Enter to authorize)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'F8') {
        e.preventDefault();
        setActiveTab('SCAN');
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Main resolver: handles invoice barcodes, product barcodes, customer phones, or gatepass numbers
  const handleResolveQuery = (query: string) => {
    const raw = query.trim();
    if (!raw) {
      setSelectedBill(null);
      setMatchedProduct(null);
      setVerificationStatus('IDLE');
      return;
    }

    const clean = raw.toUpperCase();

    // 1. Check if already recorded as exited in our audit log
    const prevExit = exitLogs.find(
      l =>
        l.invoiceNo.toUpperCase() === clean ||
        l.gatePassNo.toUpperCase() === clean ||
        l.items.some(it => it.barcode?.toUpperCase() === clean)
    );

    // 2. Look for matching Invoice in bills History
    let matchedBill = bills.find(
      b =>
        b.invoiceNo.toUpperCase() === clean ||
        b.invoiceNo.toUpperCase().replace(/[^A-Z0-9]/g, '') === clean.replace(/[^A-Z0-9]/g, '')
    );

    // If not exact invoice match, check if query matches a customer phone in bills
    if (!matchedBill) {
      matchedBill = bills.find(b => b.contactNo?.includes(raw));
    }

    // 3. Look for matching Product barcode or code
    const prod = products.find(
      p =>
        p.barcode?.toUpperCase() === clean ||
        p.pCode?.toUpperCase() === clean ||
        p.name?.toUpperCase().includes(clean)
    );
    setMatchedProduct(prod || null);

    // If query was a product barcode, find the most recent bill that contained this product
    if (!matchedBill && prod) {
      matchedBill = bills.find(b =>
        b.items?.some(
          it =>
            it.barcode?.toUpperCase() === prod.barcode?.toUpperCase() ||
            it.pCode?.toUpperCase() === prod.pCode?.toUpperCase() ||
            it.name.toLowerCase() === prod.name.toLowerCase()
        )
      );
    }

    if (matchedBill) {
      setSelectedBill(matchedBill);

      if (prevExit) {
        setExistingExitRecord(prevExit);
        setVerificationStatus('ALREADY_EXITED');
        playAudioTone('warning');
        return;
      }

      const balDue = matchedBill.balanceDue ?? 0;
      if (balDue > 0.05) {
        setVerificationStatus('PAYMENT_PENDING');
        playAudioTone('error');
      } else {
        setVerificationStatus('VERIFIED_READY');
        playAudioTone('success');

        if (autoAuthorizeOnScan) {
          handleAuthorizeExit(matchedBill, 'CASH_AND_CARRY');
        }
      }
    } else if (prod) {
      // Product exists in inventory, but no bill linked yet (or unpaid)
      setSelectedBill(null);
      setVerificationStatus('PAYMENT_PENDING');
      playAudioTone('warning');
    } else {
      setSelectedBill(null);
      setVerificationStatus('NOT_FOUND');
      playAudioTone('error');
    }
  };

  // Authorize & Stamp Store Exit in PostgreSQL Backend
  const handleAuthorizeExit = async (bill: OldBillRecord, channel: 'CASH_AND_CARRY' | 'TRUCK_DISPATCH') => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const gatePassNumber = `GP-EXT-${String(exitLogs.length + 1).padStart(4, '0')}-${new Date().getFullYear().toString().slice(-2)}`;
      const itemsList = (bill.items || []).map(it => ({
        name: it.name,
        qty: it.qty,
        barcode: it.barcode,
        rate: it.rate
      }));

      const payload = {
        gate_pass_no: gatePassNumber,
        invoice_no: bill.invoiceNo,
        customer_name: bill.customerName,
        customer_phone: bill.contactNo,
        exit_channel: channel,
        payment_status: (bill.balanceDue ?? 0) <= 0.01 ? 'PAID' : 'PARTIAL',
        amount_paid: Number(bill.paidAmount ?? bill.netPay ?? 0),
        balance_due: Number(bill.balanceDue ?? 0),
        vehicle_no: channel === 'TRUCK_DISPATCH' ? vehicleNo : undefined,
        driver_name: channel === 'TRUCK_DISPATCH' ? driverName : undefined,
        gatekeeper_name: gatekeeperName,
        items_json: JSON.stringify(itemsList),
        verification_status: 'VERIFIED_READY',
        notes: exitNotes
      };

      const backendRecord = await api.createOutwardGatePass(payload);

      const newRecord: OutwardExitRecord = {
        id: String(backendRecord.id || Date.now()),
        exitTimestamp: backendRecord.exit_timestamp ? new Date(backendRecord.exit_timestamp).toLocaleString('en-IN') : new Date().toLocaleString('en-IN'),
        gatePassNo: backendRecord.gate_pass_no || gatePassNumber,
        invoiceNo: backendRecord.invoice_no || bill.invoiceNo,
        customerName: backendRecord.customer_name || bill.customerName,
        customerPhone: backendRecord.customer_phone || bill.contactNo,
        exitChannel: channel,
        paymentStatus: (bill.balanceDue ?? 0) <= 0.01 ? 'PAID' : 'PARTIAL',
        amountPaid: Number(bill.paidAmount ?? bill.netPay ?? 0),
        balanceDue: Number(bill.balanceDue ?? 0),
        items: itemsList,
        vehicleNo: channel === 'TRUCK_DISPATCH' ? vehicleNo : undefined,
        driverName: channel === 'TRUCK_DISPATCH' ? driverName : undefined,
        gatekeeperName,
        notes: exitNotes
      };

      setExitLogs(prev => [newRecord, ...prev]);
      setExistingExitRecord(newRecord);
      setVerificationStatus('ALREADY_EXITED');
      playAudioTone('success');

      // Broadcast system event so POS, Logistics, and Ledger update in real-time
      window.dispatchEvent(
        new CustomEvent('svf-outward-exit-verified', {
          detail: newRecord
        })
      );
    } catch (err: any) {
      console.error("Failed to persist Outward Gate Pass:", err);
      alert(err.message || "Failed to persist Outward Gate Pass in PostgreSQL");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Print Gate Exit Slip
  const handlePrintExitSlip = (record: OutwardExitRecord) => {
    const printWindow = window.open('', '_blank', 'width=450,height=650');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to print the Exit Gate Pass.');
      return;
    }

    const compName = companyInfo?.name || 'SHREE VINAYAKA FURNITURES';
    const compAddress = companyInfo?.address || 'Showroom Bypass Road, Trivandrum';
    const compPhone = companyInfo?.phone || '+91 94471 23456';
    const compGst = companyInfo?.gstin || '32AABCS1234F1Z8';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Gate Exit Pass - ${record.gatePassNo}</title>
          <style>
            @page { size: 80mm auto; margin: 4mm; }
            body { font-family: 'Courier New', monospace; font-size: 11px; margin: 0; padding: 4px; color: #000; }
            .text-center { text-align: center; }
            .header { border-bottom: 2px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
            .title { font-size: 13px; font-weight: bold; margin: 4px 0; text-transform: uppercase; }
            .badge { display: inline-block; border: 1px solid #000; padding: 2px 6px; font-weight: bold; margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 10px; }
            th, td { text-align: left; padding: 3px 2px; }
            th { border-bottom: 1px dashed #000; border-top: 1px dashed #000; }
            .totals { border-top: 1px dashed #000; margin-top: 6px; padding-top: 4px; font-weight: bold; }
            .footer { border-top: 1px dashed #000; margin-top: 12px; padding-top: 8px; font-size: 9px; text-align: center; }
            .sign-box { margin-top: 18px; display: flex; justify-content: space-between; font-size: 9px; }
          </style>
        </head>
        <body>
          <div class="header text-center">
            <div style="font-size: 14px; font-weight: 800;">${compName}</div>
            <div>${compAddress}</div>
            <div>Phone: ${compPhone} | GSTIN: ${compGst}</div>
            <div class="title">OFFICIAL OUTWARD STORE EXIT PASS</div>
            <div class="badge">STATUS: VERIFIED & CLEARED FOR EXIT</div>
          </div>

          <div><strong>Gate Pass No:</strong> ${record.gatePassNo}</div>
          <div><strong>Exit Timestamp:</strong> ${record.exitTimestamp}</div>
          <div><strong>Invoice Ref:</strong> ${record.invoiceNo}</div>
          <div><strong>Customer:</strong> ${record.customerName} (${record.customerPhone || 'N/A'})</div>
          <div><strong>Channel:</strong> ${record.exitChannel === 'CASH_AND_CARRY' ? 'Front-Door Cash & Carry' : 'Warehouse Truck Dispatch'}</div>
          ${record.vehicleNo ? `<div><strong>Vehicle No:</strong> ${record.vehicleNo} | Driver: ${record.driverName || 'N/A'}</div>` : ''}

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Rate</th>
              </tr>
            </thead>
            <tbody>
              ${record.items
                .map(
                  it => `
                <tr>
                  <td>${it.name}</td>
                  <td style="text-align: center;">${it.qty}</td>
                  <td style="text-align: right;">₹${it.rate.toFixed(2)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="totals">
            <div style="display: flex; justify-content: space-between;">
              <span>Amount Paid:</span>
              <span>₹${record.amountPaid.toFixed(2)} (PAID)</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 9px; font-weight: normal;">
              <span>Balance Due:</span>
              <span>₹${record.balanceDue.toFixed(2)}</span>
            </div>
          </div>

          <div class="sign-box">
            <div>
              ____________________<br/>
              Security Officer Sign<br/>
              (${record.gatekeeperName})
            </div>
            <div style="text-align: right;">
              ____________________<br/>
              Customer/Driver Sign
            </div>
          </div>

          <div class="footer">
            Thank you for shopping at Shree Vinayaka Furnitures!<br/>
            Security Checkpoint Verified • Godrej Interio Authorized Outlet
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 15, 29, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1050px',
          maxHeight: '92vh',
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8fafc'
        }}
      >
        {/* MODAL TOP HEADER */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#1e293b',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981'
              }}
            >
              <DoorOpen size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                Store Exit & Outward Gate Pass Verification Scanner
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Verify Paid Furniture Invoices, Prevent Unpaid Exits & Authorize Delivery Truck Dispatches
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* TABS SWITCHER */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#0f172a',
                padding: '4px',
                borderRadius: '8px',
                border: '1px solid #334155',
                gap: '4px'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('SCAN')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'SCAN' ? '#2563eb' : 'transparent',
                  color: activeTab === 'SCAN' ? '#ffffff' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Barcode size={14} /> Live Exit Scanner
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('AUDIT_LOG')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'AUDIT_LOG' ? '#2563eb' : 'transparent',
                  color: activeTab === 'AUDIT_LOG' ? '#ffffff' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Clock size={14} /> Exit Audit Log ({exitLogs.length})
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: 'none',
                color: '#94a3b8',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* MODAL MAIN CONTENT */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          {activeTab === 'SCAN' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* SCANNER SEARCH BAR WITH BRONTIX LISTENER */}
              <div
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #334155'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ⚡ Scan Invoice Barcode or Product SKU / Barcode (Brontix Scanner Enabled)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={autoAuthorizeOnScan}
                      onChange={e => setAutoAuthorizeOnScan(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    Auto-authorize on clean scan
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search
                      size={20}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#64748b'
                      }}
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={scanQuery}
                      onChange={e => {
                        setScanQuery(e.target.value);
                        handleResolveQuery(e.target.value);
                      }}
                      placeholder="Aim Brontix scanner at Invoice barcode (e.g. SINV-0003) or enter Phone/SKU..."
                      style={{
                        width: '100%',
                        padding: '14px 14px 14px 46px',
                        backgroundColor: '#0f172a',
                        border: '2px solid #3b82f6',
                        borderRadius: '10px',
                        color: '#ffffff',
                        fontSize: '15px',
                        fontFamily: 'monospace',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    {scanQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setScanQuery('');
                          setSelectedBill(null);
                          setMatchedProduct(null);
                          setVerificationStatus('IDLE');
                          searchInputRef.current?.focus();
                        }}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleResolveQuery(scanQuery)}
                    style={{
                      padding: '0 24px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    Verify
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px', fontSize: '11px', color: '#64748b' }}>
                  <span>Quick Test Bills:</span>
                  {bills.slice(0, 3).map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setScanQuery(b.invoiceNo);
                        handleResolveQuery(b.invoiceNo);
                      }}
                      style={{
                        background: 'none',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        color: '#93c5fd',
                        cursor: 'pointer',
                        padding: '2px 8px',
                        fontSize: '11px'
                      }}
                    >
                      {b.invoiceNo}
                    </button>
                  ))}
                </div>
              </div>

              {/* VERIFICATION STATUS CARD */}
              {verificationStatus === 'IDLE' && (
                <div
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                    border: '2px dashed #334155',
                    borderRadius: '12px'
                  }}
                >
                  <Barcode size={48} style={{ color: '#475569', margin: '0 auto 12px auto' }} />
                  <h3 style={{ margin: 0, color: '#94a3b8', fontSize: '16px' }}>Ready for Exit Barcode Scan</h3>
                  <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                    Aim the Brontix scanner at the customer's printed invoice barcode or product tag.
                  </p>
                </div>
              )}

              {/* 🟢 CASE A: VERIFIED READY FOR EXIT */}
              {verificationStatus === 'VERIFIED_READY' && selectedBill && (
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '2px solid #10b981',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          backgroundColor: '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff'
                        }}
                      >
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            letterSpacing: '0.05em',
                            color: '#10b981',
                            textTransform: 'uppercase'
                          }}
                        >
                          Security Verified • Clear For Exit
                        </span>
                        <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
                          Invoice {selectedBill.invoiceNo} — PAID IN FULL
                        </h3>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Total Amount Paid</div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981' }}>
                        ₹{(selectedBill.paidAmount || selectedBill.netPay).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* CUSTOMER & BILL DETAILS */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px',
                      padding: '14px',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      fontSize: '13px'
                    }}
                  >
                    <div>
                      <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Customer Name</span>
                      <strong style={{ color: '#f8fafc' }}>{selectedBill.customerName}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Contact Phone</span>
                      <strong style={{ color: '#f8fafc' }}>{selectedBill.contactNo || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Bill Date</span>
                      <strong style={{ color: '#f8fafc' }}>{selectedBill.date}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Payment Method</span>
                      <strong style={{ color: '#10b981' }}>{selectedBill.paymentMode || 'UPI / Cash'} (Verified)</strong>
                    </div>
                  </div>

                  {/* CONSIGNMENT ITEMS LIST */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
                      FURNITURE ITEMS TO BE RELEASED ({selectedBill.items?.length || 0} ITEMS):
                    </div>
                    <div
                      style={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        overflow: 'hidden'
                      }}
                    >
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Furniture Item</th>
                            <th style={{ padding: '8px 12px', textAlign: 'center' }}>Qty</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Price</th>
                            <th style={{ padding: '8px 12px', textAlign: 'center' }}>Exit Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBill.items?.map((it, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                              <td style={{ padding: '8px 12px', color: '#f8fafc' }}>
                                <strong>{it.name}</strong>
                                {it.barcode && (
                                  <span style={{ display: 'block', fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                                    Barcode: {it.barcode}
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center', color: '#38bdf8', fontWeight: 700 }}>
                                {it.qty}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: '#f8fafc' }}>
                                ₹{it.rate?.toFixed(2)}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                <span
                                  style={{
                                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                    color: '#10b981',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 700
                                  }}
                                >
                                  Ready
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* OPTIONAL VEHICLE DISPATCH DETAILS */}
                  <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Vehicle No:</span>
                      <input
                        type="text"
                        value={vehicleNo}
                        onChange={e => setVehicleNo(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#ffffff',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Driver Name:</span>
                      <input
                        type="text"
                        value={driverName}
                        onChange={e => setDriverName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#ffffff',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div style={{ flex: 2 }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Exit Notes:</span>
                      <input
                        type="text"
                        value={exitNotes}
                        onChange={e => setExitNotes(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#ffffff',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {/* AUTHORIZE ACTIONS */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleAuthorizeExit(selectedBill, 'CASH_AND_CARRY')}
                      style={{
                        flex: 1,
                        padding: '14px 20px',
                        backgroundColor: isSubmitting ? '#475569' : '#10b981',
                        color: '#0f172a',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '15px',
                        fontWeight: 800,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                      }}
                    >
                      <ShieldCheck size={20} /> {isSubmitting ? 'Stamping in PostgreSQL...' : 'Authorize Front-Door Exit (Cash & Carry)'}
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleAuthorizeExit(selectedBill, 'TRUCK_DISPATCH')}
                      style={{
                        flex: 1,
                        padding: '14px 20px',
                        backgroundColor: isSubmitting ? '#475569' : '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '15px',
                        fontWeight: 800,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
                      }}
                    >
                      <Truck size={20} /> {isSubmitting ? 'Stamping in PostgreSQL...' : 'Authorize Warehouse Truck Dispatch'}
                    </button>
                  </div>
                </div>
              )}

              {/* 🟡 CASE B: ALREADY EXITED WARNING */}
              {verificationStatus === 'ALREADY_EXITED' && existingExitRecord && (
                <div
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    border: '2px solid #f59e0b',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          backgroundColor: '#f59e0b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#0f172a'
                        }}
                      >
                        <AlertTriangle size={24} />
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            letterSpacing: '0.05em',
                            color: '#f59e0b',
                            textTransform: 'uppercase'
                          }}
                        >
                          Security Alert • Consignment Already Left Store
                        </span>
                        <h3 style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
                          Already Exited at {existingExitRecord.exitTimestamp}
                        </h3>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePrintExitSlip(existingExitRecord)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#334155',
                        color: '#f8fafc',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Printer size={16} /> Re-Print Gate Exit Pass
                    </button>
                  </div>

                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: 'rgba(15, 23, 42, 0.7)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#cbd5e1'
                    }}
                  >
                    <strong>Pass No:</strong> {existingExitRecord.gatePassNo} | <strong>Invoice:</strong> {existingExitRecord.invoiceNo} |{' '}
                    <strong>Customer:</strong> {existingExitRecord.customerName} |{' '}
                    <strong>Cleared By:</strong> {existingExitRecord.gatekeeperName}
                    <div style={{ marginTop: '6px', fontSize: '12px', color: '#f59e0b' }}>
                      ⚠️ Warning: Do not release duplicate furniture pieces. This consignment was already verified and logged out of the premises.
                    </div>
                  </div>
                </div>
              )}

              {/* 🔴 CASE C: PAYMENT PENDING / NOT FOUND */}
              {verificationStatus === 'PAYMENT_PENDING' && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '2px solid #ef4444',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff'
                      }}
                    >
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>
                        Gate Clearance Denied • Payment Pending
                      </span>
                      <h3 style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
                        {selectedBill
                          ? `Invoice ${selectedBill.invoiceNo} Has Balance Due of ₹${(selectedBill.balanceDue || 0).toLocaleString('en-IN')}`
                          : `Furniture Item (${matchedProduct?.name || scanQuery}) Has Not Been Billed / Settled`}
                      </h3>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#fca5a5' }}>
                    Items cannot exit the showroom until payment is fully settled at the POS counter. Direct the customer to the billing desk.
                  </p>
                </div>
              )}

              {verificationStatus === 'NOT_FOUND' && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid #ef4444',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center'
                  }}
                >
                  <h4 style={{ margin: 0, color: '#ef4444', fontSize: '15px' }}>
                    No Matching Invoice or Product Barcode Found: "{scanQuery}"
                  </h4>
                  <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    Check if the barcode is properly aligned or try searching by customer phone number or invoice number.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* AUDIT LOG TAB */}
          {activeTab === 'AUDIT_LOG' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                  Today's Store Outward Movement Log ({exitLogs.length} Records)
                </h3>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Audited & Timestamped by Security Gate • Permanent Audit Trail
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  overflow: 'hidden'
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left' }}>Time & Pass No</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left' }}>Invoice Ref</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left' }}>Customer</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left' }}>Channel</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left' }}>Furniture Items Cleared</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exitLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                          No store exits recorded today yet.
                        </td>
                      </tr>
                    ) : (
                      exitLogs.map(log => (
                        <tr key={log.id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontWeight: 700, color: '#f8fafc' }}>{log.gatePassNo}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{log.exitTimestamp}</div>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#38bdf8', fontWeight: 700 }}>
                            {log.invoiceNo}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ color: '#f8fafc', fontWeight: 600 }}>{log.customerName}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{log.customerPhone || 'N/A'}</div>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 700,
                                backgroundColor:
                                  log.exitChannel === 'CASH_AND_CARRY' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(37, 99, 235, 0.2)',
                                color: log.exitChannel === 'CASH_AND_CARRY' ? '#10b981' : '#60a5fa'
                              }}
                            >
                              {log.exitChannel === 'CASH_AND_CARRY' ? 'CASH & CARRY' : 'TRUCK DISPATCH'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>
                            {log.items.map(it => `${it.name} (x${it.qty})`).join(', ')}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>
                            ₹{log.amountPaid.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handlePrintExitSlip(log)}
                              style={{
                                padding: '4px 10px',
                                backgroundColor: '#334155',
                                color: '#f8fafc',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Printer size={12} /> Print Slip
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            padding: '14px 24px',
            backgroundColor: '#1e293b',
            borderTop: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#94a3b8'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>
              Gatekeeper: <strong style={{ color: '#f8fafc' }}>{gatekeeperName}</strong>
            </span>
            <span>•</span>
            <span>
              Brontix Scanner Status: <strong style={{ color: '#10b981' }}>🟢 Active & Listening</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 18px',
                backgroundColor: 'transparent',
                border: '1px solid #475569',
                color: '#cbd5e1',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Close (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
