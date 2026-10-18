import { useState, useEffect } from 'react';
import { api, type InquiryResponse } from '../../api/client';

interface WebInquiriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadIntoCart?: (customerName: string, phone: string, itemTitle?: string) => void;
}

export function WebInquiriesModal({
  isOpen,
  onClose,
  onLoadIntoCart
}: WebInquiriesModalProps) {
  const [inquiries, setInquiries] = useState<InquiryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const baseUrl = api.getBaseUrl();
      const res = await fetch(`${baseUrl}/inquiries/`);
      if (res.ok) {
        const data = await res.json();
        setInquiries(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Failed to fetch inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInquiries();
      setActionMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = inquiries.filter(inq => {
    const matchesFilter = filterStatus === 'ALL' || inq.status?.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = !searchTerm ||
      inq.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.phone?.includes(searchTerm) ||
      inq.furniture_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.message?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.updateInquiryStatus(id, status);
      setInquiries(prev => prev.map(item => item.id === id ? { ...item, status } : item));
      setActionMessage(`✓ Inquiry #${id} marked as "${status}"`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch {
      setActionMessage(`⚠️ Could not update inquiry status`);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleConvertToQuotation = async (inquiry: InquiryResponse) => {
    try {
      const result = await api.convertInquiryToQuotation(inquiry.id);
      setActionMessage(`🎉 Converted to Quotation #${result.quotation_no || result.id || 'OK'}!`);
      handleUpdateStatus(inquiry.id, 'converted');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage(`⚠️ Conversion error: ${err.message || 'Failed'}`);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  return (
    <div className="rd-modal-overlay">
      <div className="rd-dialog" style={{ width: '850px', maxWidth: '96vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(180deg, #d97706 0%, #b45309 100%)',
          color: '#ffffff',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #92400e'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🌐</span>
            <div>
              <div style={{ fontWeight: '900', fontSize: '14px', letterSpacing: '0.5px' }}>
                Online Showroom Inquiries & Customer Leads
              </div>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>
                Direct inquiries from your website catalog, custom furniture requests & showroom visits
              </div>
            </div>
          </div>
          <button
            type="button"
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Action Banner */}
        {actionMessage && (
          <div style={{ background: '#dcfce7', borderBottom: '1px solid #86efac', padding: '6px 16px', color: '#166534', fontSize: '12px', fontWeight: 'bold' }}>
            {actionMessage}
          </div>
        )}

        {/* Filter Bar */}
        <div style={{ padding: '8px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="rd-pos-input"
            style={{ width: '220px' }}
            placeholder="Search by name, phone, item..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '4px' }}>
            {['ALL', 'pending', 'contacted', 'converted', 'closed'].map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: filterStatus === st ? '1px solid #b45309' : '1px solid #cbd5e1',
                  background: filterStatus === st ? '#fef3c7' : '#ffffff',
                  color: filterStatus === st ? '#92400e' : '#475569',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchInquiries}
            style={{ marginLeft: 'auto', padding: '4px 12px', background: '#e2e8f0', border: '1px solid #94a3b8', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
            title="Refresh inquiries list from backend"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Inquiries Content List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <div>⏳ Loading website inquiries from server...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#64748b' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📬</div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>No website customer inquiries found</div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>
                When customers submit inquiries or customize furniture on your website, they appear here live.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filtered.map(inq => (
                <div
                  key={inq.id}
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    background: inq.status === 'converted' ? '#f0fdf4' : inq.status === 'contacted' ? '#eff6ff' : '#ffffff',
                    padding: '10px 14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '13px', color: '#0f172a' }}>{inq.customer_name}</strong>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>📞 {inq.phone}</span>
                        {inq.email && <span style={{ fontSize: '11px', color: '#0284c7' }}>✉ {inq.email}</span>}
                      </div>
                      {inq.furniture_title && (
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#b45309', marginTop: '3px' }}>
                          🛋️ Requested Product: {inq.furniture_title}
                        </div>
                      )}
                      <div style={{ fontSize: '11.5px', color: '#334155', marginTop: '4px', background: '#f8fafc', padding: '6px 10px', borderRadius: '4px', borderLeft: '3px solid #f59e0b' }}>
                        "{inq.message || 'Customer requested callback & catalog price'}"
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                        Received: {new Date(inq.created_at || Date.now()).toLocaleString()}
                      </div>
                    </div>

                    {/* Actions on this lead */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '150px', alignItems: 'flex-end' }}>
                      <select
                        value={inq.status || 'pending'}
                        onChange={e => handleUpdateStatus(inq.id, e.target.value)}
                        style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          background: inq.status === 'converted' ? '#dcfce7' : inq.status === 'contacted' ? '#dbeafe' : '#fef3c7',
                          color: inq.status === 'converted' ? '#15803d' : inq.status === 'contacted' ? '#1d4ed8' : '#b45309',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="pending">🟡 Pending / New</option>
                        <option value="contacted">🔵 Contacted</option>
                        <option value="converted">🟢 Converted to Sale</option>
                        <option value="closed">⚪ Closed</option>
                      </select>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        {/* WhatsApp Button */}
                        {inq.phone && (
                          <a
                            href={`https://wa.me/91${inq.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: '#25D366',
                              color: '#fff',
                              fontSize: '10.5px',
                              fontWeight: 'bold',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Chat on WhatsApp"
                          >
                            <span>💬 WhatsApp</span>
                          </a>
                        )}

                        {/* Convert to Quotation Button */}
                        <button
                          type="button"
                          onClick={() => handleConvertToQuotation(inq)}
                          style={{
                            background: '#ea580c',
                            color: '#fff',
                            border: 'none',
                            fontSize: '10.5px',
                            fontWeight: 'bold',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                          title="Generate official Quotation for customer"
                        >
                          📄 Quotation
                        </button>
                      </div>

                      {/* Load to POS Cart */}
                      {onLoadIntoCart && (
                        <button
                          type="button"
                          onClick={() => {
                            onLoadIntoCart(inq.customer_name, inq.phone, inq.furniture_title);
                            handleUpdateStatus(inq.id, 'contacted');
                            onClose();
                          }}
                          style={{
                            width: '100%',
                            background: 'linear-gradient(180deg, #15803d 0%, #166534 100%)',
                            color: '#fff',
                            border: '1px solid #15803d',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>🛒</span>
                          <span>Load into POS Cart</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 16px', background: '#f1f5f9', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Total Website Inquiries: <strong>{inquiries.length}</strong> (Showing: {filtered.length})
          </span>
          <button
            type="button"
            className="rd-f-btn"
            style={{ height: '32px', minWidth: '80px', background: '#64748b', fontSize: '12px' }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
