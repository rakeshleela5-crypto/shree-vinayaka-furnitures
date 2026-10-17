import React, { useState, useMemo } from 'react';
import type { IncomeVoucher } from '../../types/retailDaddy';

interface IncomeDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  incomeVouchers: IncomeVoucher[];
  onOpenNewIncome?: () => void;
}

export const IncomeDashboardModal: React.FC<IncomeDashboardModalProps> = ({
  isOpen,
  onClose,
  incomeVouchers,
  onOpenNewIncome
}) => {
  const [fromDate, setFromDate] = useState('01/03/2025');
  const [toDate, setToDate] = useState('03/03/2025');
  const [appliedDateRange, setAppliedDateRange] = useState<{ from: string; to: string } | null>(null);
  const [searchCategory, setSearchCategory] = useState<'Name' | 'Voucher No' | 'Particulars' | 'Note' | 'Payment Mode'>('Name');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);

  if (!isOpen) return null;

  const parseDate = (dStr: string): number => {
    if (!dStr) return 0;
    if (dStr.includes('/')) {
      const parts = dStr.split('/');
      if (parts.length === 3) {
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
      }
    }
    const t = new Date(dStr).getTime();
    return isNaN(t) ? 0 : t;
  };

  const handleGetData = () => {
    setAppliedDateRange({ from: fromDate.trim(), to: toDate.trim() });
  };

  // Flatten vouchers to individual line item rows for the grid matching Frame 0560
  const flattenedRows = useMemo(() => {
    const list: Array<{
      id: string;
      voucherId: string;
      voucherNo: string;
      date: string;
      name: string;
      particulars: string;
      amount: number;
      note: string;
      paymentMode: string;
    }> = [];

    incomeVouchers.forEach(v => {
      v.items.forEach((it, idx) => {
        list.push({
          id: `${v.id}-${it.id || idx}`,
          voucherId: v.id,
          voucherNo: v.voucherNo,
          date: v.date,
          name: v.name,
          particulars: it.particulars,
          amount: it.amount,
          note: it.notes || 'Income (Direct/Indirect)',
          paymentMode: v.paymentMode
        });
      });
    });

    return list;
  }, [incomeVouchers]);

  // Filtering
  const filteredRows = useMemo(() => {
    return flattenedRows.filter(row => {
      if (appliedDateRange && (appliedDateRange.from || appliedDateRange.to)) {
        const rowTime = parseDate(row.date);
        const fromTime = parseDate(appliedDateRange.from);
        const toTime = parseDate(appliedDateRange.to);
        if (fromTime && rowTime < fromTime) return false;
        if (toTime && rowTime > toTime + 86400000 - 1) return false;
      }

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      switch (searchCategory) {
        case 'Name':
          return row.name.toLowerCase().includes(q);
        case 'Voucher No':
          return row.voucherNo.toLowerCase().includes(q);
        case 'Particulars':
          return row.particulars.toLowerCase().includes(q);
        case 'Note':
          return row.note.toLowerCase().includes(q);
        case 'Payment Mode':
          return row.paymentMode.toLowerCase().includes(q);
        default:
          return true;
      }
    });
  }, [flattenedRows, searchQuery, searchCategory, appliedDateRange]);

  const totalAmount = filteredRows.reduce((sum, r) => sum + r.amount, 0);

  const handleReset = () => {
    setSearchQuery('');
    setAppliedDateRange(null);
    setFromDate('01/03/2025');
    setToDate('03/03/2025');
  };

  const handleExportExcel = () => {
    const headers = ['Voucher No', 'Date', 'Name', 'Particulars', 'Amount', 'Note', 'Payment Mode'];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...filteredRows.map(r =>
          [r.voucherNo, r.date, r.name, r.particulars, r.amount, `"${r.note}"`, r.paymentMode].join(',')
        )
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Income_Dashboard_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        backdropFilter: 'blur(3px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '920px',
          maxWidth: '96vw',
          backgroundColor: '#f1f5f9',
          borderRadius: '6px',
          border: '2px solid #0048ba',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Title Bar - Frame 0560 */}
        <div
          style={{
            background: 'linear-gradient(180deg, #0052cc 0%, #003366 100%)',
            color: '#ffffff',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ textAlign: 'center', flex: 1, fontSize: '16px', fontWeight: 'bold' }}>
            Income Dashboard
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#dc2626',
              border: 'none',
              color: '#ffffff',
              width: '26px',
              height: '26px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Filter Controls Row - Frame 0560 */}
        <div style={{ padding: '12px 16px', backgroundColor: '#e2e8f0', display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Left Date Range Box */}
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px'
            }}
          >
            <span style={{ fontWeight: 600, color: '#475569' }}>From:</span>
            <input
              type="text"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              style={{ width: '80px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
            />
            <span style={{ fontWeight: 600, color: '#475569' }}>To:</span>
            <input
              type="text"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              style={{ width: '80px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
            />
            <button
              onClick={handleGetData}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '3px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Get Data
            </button>
          </div>

          {/* Middle Category Search Box */}
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1,
              fontSize: '11px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Select Category</span>
              <select
                value={searchCategory}
                onChange={e => setSearchCategory(e.target.value as any)}
                style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
              >
                <option value="Name">Name</option>
                <option value="Voucher No">Voucher No</option>
                <option value="Particulars">Particulars</option>
                <option value="Note">Note</option>
                <option value="Payment Mode">Payment Mode</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Search</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="e.g. MADHU, SCRAP, Bank"
                  style={{ flex: 1, padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                />
                <button
                  onClick={() => setSearchQuery('')}
                  title="Clear"
                  style={{
                    backgroundColor: '#22c55e',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  🔄
                </button>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleReset}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                padding: '7px 14px',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
              }}
            >
              Reset
            </button>

            <button
              onClick={handleExportExcel}
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                padding: '7px 14px',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
              }}
            >
              Export Excel
            </button>
          </div>
        </div>

        {/* Income Grid Table - Frame 0560 */}
        <div style={{ padding: '16px' }}>
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #003366',
              borderRadius: '4px',
              overflow: 'hidden',
              maxHeight: '340px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 140px 90px 100px 130px 100px 1.5fr 90px',
                backgroundColor: '#003366',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '11px',
                padding: '7px 8px'
              }}
            >
              <div>#</div>
              <div>Voucher No</div>
              <div>Date</div>
              <div>Name</div>
              <div>Particulars</div>
              <div style={{ textAlign: 'right' }}>Amount</div>
              <div>Note</div>
              <div style={{ textAlign: 'center' }}>Payment Mode</div>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: '290px' }}>
              {filteredRows.map((r, idx) => {
                const isSelected = selectedVoucherId === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedVoucherId(r.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 140px 90px 100px 130px 100px 1.5fr 90px',
                      padding: '6px 8px',
                      fontSize: '11px',
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#fef08a' : idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      color: '#0f172a',
                      fontWeight: isSelected ? 'bold' : 500,
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {isSelected && <span style={{ color: '#dc2626', fontSize: '10px' }}>▷</span>}
                      <span>{idx + 1}</span>
                    </div>
                    <div style={{ fontWeight: 600, color: '#0284c7' }}>{r.voucherNo}</div>
                    <div>{r.date}</div>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div style={{ color: '#0f172a' }}>{r.particulars}</div>
                    <div style={{ textAlign: 'right', fontWeight: 'bold' }}>{r.amount.toFixed(2)}</div>
                    <div style={{ color: '#64748b', fontSize: '10px' }}>{r.note}</div>
                    <div style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          backgroundColor: r.paymentMode === 'Bank' ? '#dbeafe' : '#fef3c7',
                          color: r.paymentMode === 'Bank' ? '#1d4ed8' : '#b45309'
                        }}
                      >
                        {r.paymentMode}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredRows.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  No matching income vouchers found.
                </div>
              )}
            </div>
          </div>

          {/* Footer Total - Frame 0560 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '12px'
            }}
          >
            {onOpenNewIncome && (
              <button
                onClick={onOpenNewIncome}
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#003366',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                + Create New Income Voucher
              </button>
            )}

            <div style={{ marginLeft: 'auto', fontSize: '14px', fontWeight: 'bold', color: '#003366' }}>
              Total : {totalAmount.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
