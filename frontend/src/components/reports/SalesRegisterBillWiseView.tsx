import { useState } from 'react';
import type { SalesRegisterBill } from '../../types/retailDaddy';

interface SalesRegisterBillWiseViewProps {
  bills: SalesRegisterBill[];
  onClose: () => void;
}

export function SalesRegisterBillWiseView({
  bills,
  onClose
}: SalesRegisterBillWiseViewProps) {
  const getFyStart = () => {
    const d = new Date();
    const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
    return `01/04/${y}`;
  };
  const getToday = () => new Date().toLocaleDateString('en-GB');

  const [fromDate, setFromDate] = useState<string>(getFyStart);
  const [toDate, setToDate] = useState<string>(getToday);
  const [filterCustomer, setFilterCustomer] = useState<string>('');
  const [displayedBills, setDisplayedBills] = useState<SalesRegisterBill[]>(bills);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  // Helper to parse DD/MM/YYYY into timestamp
  const parseDateStr = (dStr: string): number => {
    const parts = dStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
    }
    return 0;
  };

  const handleGetData = () => {
    const fromTime = parseDateStr(fromDate);
    const toTime = parseDateStr(toDate) + (24 * 60 * 60 * 1000); // end of day

    const filtered = bills.filter(b => {
      const bTime = parseDateStr(b.date);
      const inDateRange = (!fromTime || bTime >= fromTime) && (!toTime || bTime <= toTime);
      const matchesCust = !filterCustomer || b.customerName.toLowerCase().includes(filterCustomer.toLowerCase()) || b.billNo.toLowerCase().includes(filterCustomer.toLowerCase());
      return inDateRange && matchesCust;
    });

    setDisplayedBills(filtered);
  };

  const handleReset = () => {
    setFromDate(getFyStart());
    setToDate(getToday());
    setFilterCustomer('');
    setDisplayedBills(bills);
  };

  const handleExportExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      ["Bill No,Date,Customer Name,GSTIN,Bill Amount,Taxable Amount,CGST Amount,SGST Amount,IGST Amount,CESS Amount,Other Amount"]
        .concat(
          displayedBills.map(b =>
            `"${b.billNo}","${b.date}","${b.customerName}","${b.gstin}",${b.billAmount.toFixed(2)},${b.taxableAmount.toFixed(2)},${b.cgstAmount.toFixed(2)},${b.sgstAmount.toFixed(2)},${b.igstAmount.toFixed(2)},${b.cessAmount.toFixed(2)},${b.otherAmount.toFixed(2)}`
          )
        ).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sales_Register_Bill_Wise_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Grand Totals matching Video 16 Frame 0150
  const totalBillAmt = displayedBills.reduce((acc, b) => acc + b.billAmount, 0);
  const totalTaxableAmt = displayedBills.reduce((acc, b) => acc + b.taxableAmount, 0);
  const totalCgstAmt = displayedBills.reduce((acc, b) => acc + b.cgstAmount, 0);
  const totalSgstAmt = displayedBills.reduce((acc, b) => acc + b.sgstAmount, 0);
  const totalIgstAmt = displayedBills.reduce((acc, b) => acc + b.igstAmount, 0);
  const totalCessAmt = displayedBills.reduce((acc, b) => acc + b.cessAmount, 0);
  const totalOtherAmt = displayedBills.reduce((acc, b) => acc + b.otherAmount, 0);

  return (
    <div
      className="rd-window"
      style={{
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        height: isMaximized ? '100vh' : '100%',
        width: isMaximized ? '100vw' : '100%',
        position: isMaximized ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        zIndex: isMaximized ? 9999 : 'auto'
      }}
    >
      {/* 1. Title bar (Frame 0150) */}
      <div style={{
        background: 'linear-gradient(180deg, #002b55 0%, #001a33 100%)',
        color: '#ffffff',
        padding: '6px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
          Sales Register (Bill Wise)
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '12px' }}
            onClick={onClose}
            title="Minimize"
          >
            _
          </button>
          <button
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '12px' }}
            onClick={() => setIsMaximized(prev => !prev)}
            title={isMaximized ? "Restore Window" : "Maximize Window"}
          >
            □
          </button>
          <button
            style={{ background: '#dc2626', border: '1px solid #b91c1c', color: '#fff', fontWeight: 'bold', fontSize: '11px', padding: '3px 10px', borderRadius: '4px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
            onClick={onClose}
            title="Exit Sales Register [Esc]"
          >
            ✕ EXIT [Esc]
          </button>
        </div>
      </div>

      {/* 2. Search by Invoice Date Strip (Frame 0150) */}
      <div style={{
        padding: '12px 16px',
        background: '#ffffff',
        borderBottom: '1px solid #cbd5e1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Left Filter Box */}
        <div style={{
          border: '1px solid #cbd5e1',
          borderRadius: '4px',
          padding: '8px 12px',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a' }}>
            Search by Invoice Date :
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>From :</span>
            <input
              type="text"
              className="rd-pos-input"
              style={{ width: '95px', textAlign: 'center', fontWeight: 'bold' }}
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>To :</span>
            <input
              type="text"
              className="rd-pos-input"
              style={{ width: '95px', textAlign: 'center', fontWeight: 'bold' }}
              value={toDate}
              onChange={e => setToDate(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="rd-grid-btn"
            style={{
              background: 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '11px',
              padding: '4px 14px'
            }}
            onClick={handleGetData}
          >
            Get Data
          </button>

          <button
            type="button"
            className="rd-grid-btn"
            style={{
              background: 'linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '11px',
              padding: '4px 14px'
            }}
            onClick={handleReset}
          >
            Reset
          </button>
        </div>

        {/* Right Action Buttons (Frame 0150) */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="rd-grid-btn"
            style={{
              background: 'linear-gradient(180deg, #002b55 0%, #001a33 100%)',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '12px',
              padding: '6px 18px'
            }}
            onClick={() => window.print()}
          >
            Print
          </button>

          <button
            type="button"
            className="rd-grid-btn"
            style={{
              background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '12px',
              padding: '6px 18px'
            }}
            onClick={handleExportExcel}
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* 3. Main Data Table (Frame 0150) */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px', background: '#ffffff' }}>
        <table className="rd-data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ background: '#002b55', color: '#ffffff' }}>
              <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #001a33', width: '30px' }}>#</th>
              <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #001a33', width: '140px' }}>Bill No</th>
              <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #001a33', width: '90px' }}>Date</th>
              <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #001a33' }}>Customer Name</th>
              <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #001a33', width: '70px' }}>GSTIN</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #001a33', width: '100px' }}>Bill Amount</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #001a33', width: '100px' }}>Taxable Amount</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #001a33', width: '90px' }}>CGST Amount</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #001a33', width: '90px' }}>SGST Amount</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #001a33', width: '90px' }}>IGST Amount</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #001a33', width: '80px' }}>CESS Amount</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #001a33', width: '80px' }}>Other Amount</th>
            </tr>
          </thead>
          <tbody>
            {displayedBills.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No bills found for the selected invoice date period.
                </td>
              </tr>
            ) : (
              displayedBills.map((b, idx) => (
                <tr
                  key={b.id || idx}
                  style={{
                    background: idx % 2 === 0 ? '#fef9c3' : '#ffffff',
                    borderBottom: '1px solid #e2e8f0'
                  }}
                >
                  <td style={{ padding: '5px', textAlign: 'center', color: '#1e3a8a', fontWeight: 'bold' }}>{idx + 1}</td>
                  <td style={{ padding: '5px 8px', fontWeight: 'bold', color: '#1e3a8a' }}>{b.billNo}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: b.date === '06/11/2024' ? '900' : 'normal', color: b.date === '06/11/2024' ? '#dc2626' : 'inherit' }}>
                    {b.date}
                  </td>
                  <td style={{ padding: '5px 8px', fontWeight: 'bold' }}>{b.customerName}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'center' }}>{b.gstin || '0'}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>{b.billAmount.toFixed(2)}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right' }}>{b.taxableAmount.toFixed(2)}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right' }}>{b.cgstAmount.toFixed(2)}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right' }}>{b.sgstAmount.toFixed(2)}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right' }}>{b.igstAmount.toFixed(2)}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right' }}>{b.cessAmount.toFixed(2)}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right' }}>{b.otherAmount.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Grand Total Summary Strip (Frame 0150) */}
      <div style={{
        background: '#ffffff',
        borderTop: '2px solid #002b55',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '8px',
        fontSize: '11px'
      }}>
        <span style={{ fontWeight: '900', color: '#dc2626', fontSize: '12px', marginRight: '8px' }}>
          Grand Total Summary :
        </span>

        <div style={{ border: '1px solid #cbd5e1', borderRadius: '3px', padding: '2px 6px', textAlign: 'center', background: '#f8fafc' }}>
          <div style={{ fontSize: '9px', color: '#64748b' }}>Bill Amount</div>
          <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{totalBillAmt.toFixed(2)}</div>
        </div>

        <div style={{ border: '1px solid #cbd5e1', borderRadius: '3px', padding: '2px 6px', textAlign: 'center', background: '#f8fafc' }}>
          <div style={{ fontSize: '9px', color: '#64748b' }}>Taxable Amount</div>
          <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{totalTaxableAmt.toFixed(2)}</div>
        </div>

        <div style={{ border: '1px solid #cbd5e1', borderRadius: '3px', padding: '2px 6px', textAlign: 'center', background: '#f8fafc' }}>
          <div style={{ fontSize: '9px', color: '#64748b' }}>CGST Amount</div>
          <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{totalCgstAmt.toFixed(2)}</div>
        </div>

        <div style={{ border: '1px solid #cbd5e1', borderRadius: '3px', padding: '2px 6px', textAlign: 'center', background: '#f8fafc' }}>
          <div style={{ fontSize: '9px', color: '#64748b' }}>SGST Amount</div>
          <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{totalSgstAmt.toFixed(2)}</div>
        </div>

        <div style={{ border: '1px solid #cbd5e1', borderRadius: '3px', padding: '2px 6px', textAlign: 'center', background: '#f8fafc' }}>
          <div style={{ fontSize: '9px', color: '#64748b' }}>IGST Amount</div>
          <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{totalIgstAmt.toFixed(2)}</div>
        </div>

        <div style={{ border: '1px solid #cbd5e1', borderRadius: '3px', padding: '2px 6px', textAlign: 'center', background: '#f8fafc' }}>
          <div style={{ fontSize: '9px', color: '#64748b' }}>CESS Amount</div>
          <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{totalCessAmt.toFixed(2)}</div>
        </div>

        <div style={{ border: '1px solid #cbd5e1', borderRadius: '3px', padding: '2px 6px', textAlign: 'center', background: '#f8fafc' }}>
          <div style={{ fontSize: '9px', color: '#64748b' }}>Other Amount</div>
          <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{totalOtherAmt.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
