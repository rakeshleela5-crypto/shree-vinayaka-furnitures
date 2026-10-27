import { useState } from 'react';
import type { Customer, CompanyInfo } from '../../types/retailDaddy';
import { api } from '../../api/client';

interface WhatsAppBulkSenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  companyInfo: CompanyInfo;
}

const TEMPLATES = [
  {
    name: '🛋️ New Showroom Catalogue & Arrivals',
    text: `Dear {customer_name},\n\nGreetings from *{company_name}*!\n\nWe are delighted to invite you to explore our brand new furniture collection arriving directly at our showroom. We have exciting new designs in solid teak wood sofas, ergonomic executive chairs, dining sets, and modern wardrobes.\n\n📍 Visit our showroom: {company_address}\n📞 WhatsApp/Call: {company_phone}\n\nReply to this message to receive our latest product photo brochure!`
  },
  {
    name: '🎉 Festive Furniture Mega Offer (Up to 35% OFF)',
    text: `Hello {customer_name},\n\nSpecial Festive Celebration at *{company_name}*!\n\nGet up to *35% OFF* on all Living Room & Bedroom furniture sets this week. Free doorstep delivery & installation across the district!\n\n📍 Showroom: {company_address}\n📞 Call us: {company_phone}\n\nHurry, limited showroom stock available!`
  },
  {
    name: '💳 Friendly Balance & Statement Notice',
    text: `Dear {customer_name},\n\nThis is a friendly statement update from *{company_name}*.\n\nYour current outstanding balance on account is *₹{balance}*.\nKindly arrange for the settlement at your convenience or visit our showroom.\n\n📞 Accounts Enquiry: {company_phone}\nThank you for choosing us!`
  }
];

export function WhatsAppBulkSenderModal({
  isOpen,
  onClose,
  customers,
  companyInfo
}: WhatsAppBulkSenderModalProps) {
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>(() =>
    customers.map(c => c.id)
  );
  const [customerFilter, setCustomerFilter] = useState<'ALL' | 'BALANCE_DUE' | 'RETAIL'>('ALL');
  const [messageTemplate, setMessageTemplate] = useState<string>(TEMPLATES[0].text);
  const [sentCustomerIds, setSentCustomerIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredCustomers = customers.filter(c => {
    if (customerFilter === 'BALANCE_DUE') return (c.balance || 0) > 0;
    if (customerFilter === 'RETAIL') return !c.gstin;
    return true;
  });

  const selectedCustomers = filteredCustomers.filter(c => selectedCustomerIds.includes(c.id));

  const toggleSelectCustomer = (id: string) => {
    if (selectedCustomerIds.includes(id)) {
      setSelectedCustomerIds(selectedCustomerIds.filter(cid => cid !== id));
    } else {
      setSelectedCustomerIds([...selectedCustomerIds, id]);
    }
  };

  const selectAll = () => {
    setSelectedCustomerIds(filteredCustomers.map(c => c.id));
  };

  const deselectAll = () => {
    setSelectedCustomerIds([]);
  };

  const formatMessageForCustomer = (cust: Customer): string => {
    let msg = messageTemplate;
    msg = msg.replace(/{customer_name}/g, cust.name || 'Valued Customer');
    msg = msg.replace(/{company_name}/g, companyInfo.name || 'Sri Vinayaka Furnitures');
    msg = msg.replace(/{company_phone}/g, companyInfo.contactNo || '+91 94477 12345');
    msg = msg.replace(/{company_address}/g, companyInfo.address || 'Vaikom Showroom');
    msg = msg.replace(/{balance}/g, (cust.balance || 0).toFixed(2));
    msg = msg.replace(/{phone}/g, cust.phone || '');
    return msg;
  };

  const handleSendToCustomer = (cust: Customer) => {
    const cleanPhone = (cust.phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast(`⚠️ Customer ${cust.name} does not have a valid 10-digit phone number.`);
      return;
    }
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const personalizedText = formatMessageForCustomer(cust);
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(personalizedText)}`;
    
    window.open(url, '_blank');
    if (!sentCustomerIds.includes(cust.id)) {
      setSentCustomerIds([...sentCustomerIds, cust.id]);
    }

    const rawCustId = parseInt(cust.id.replace(/\D/g, ''), 10) || undefined;
    api.createCampaignLog({
      campaign_name: 'WhatsApp Bulk Catalogue/Offer',
      customer_id: rawCustId,
      customer_name: cust.name,
      phone: phoneWithCountry,
      channel: 'WHATSAPP',
      message_content: personalizedText,
      status: 'SENT'
    }).catch(err => console.warn('PostgreSQL campaign log sync error:', err));

    showToast(`✓ Opened WhatsApp message for ${cust.name} & logged to PostgreSQL!`);
  };

  const handleNextQuickSend = () => {
    const unsent = selectedCustomers.filter(c => !sentCustomerIds.includes(c.id));
    if (unsent.length === 0) {
      showToast('🎉 All selected customers have been sent messages!');
      return;
    }
    const nextCust = unsent[0];
    handleSendToCustomer(nextCust);
  };

  return (
    <div className="rd-modal-overlay" style={{ zIndex: 99999 }}>
      <div className="rd-dialog" style={{ width: '1100px', maxWidth: '98vw', height: '88vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header Bar */}
        <div style={{
          background: 'linear-gradient(180deg, #15803d 0%, #166534 100%)',
          color: '#ffffff',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #14532d'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>💬</span>
            <div>
              <div style={{ fontWeight: '900', fontSize: '14px', letterSpacing: '0.5px' }}>
                WhatsApp Bulk Marketing & Customer Broadcaster
              </div>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>
                Directly broadcast new showroom arrivals, catalogues & festive furniture offers to customer contacts
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

        {/* Toast Notification */}
        {toastMessage && (
          <div style={{ background: '#dcfce7', borderBottom: '1px solid #86efac', padding: '6px 16px', color: '#166534', fontSize: '12px', fontWeight: 'bold' }}>
            {toastMessage}
          </div>
        )}

        {/* Main Body */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '420px 1fr', overflow: 'hidden' }}>
          {/* Left Column: Customer Selector & Filter */}
          <div style={{ borderRight: '1px solid #cbd5e1', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
            {/* Filter Tabs */}
            <div style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setCustomerFilter('ALL')}
                style={{ flex: 1, padding: '4px', fontSize: '10.5px', fontWeight: 'bold', background: customerFilter === 'ALL' ? '#15803d' : '#fff', color: customerFilter === 'ALL' ? '#fff' : '#0f172a', border: '1px solid #cbd5e1', borderRadius: '3px', cursor: 'pointer' }}
              >
                All ({customers.length})
              </button>
              <button
                type="button"
                onClick={() => setCustomerFilter('BALANCE_DUE')}
                style={{ flex: 1, padding: '4px', fontSize: '10.5px', fontWeight: 'bold', background: customerFilter === 'BALANCE_DUE' ? '#15803d' : '#fff', color: customerFilter === 'BALANCE_DUE' ? '#fff' : '#0f172a', border: '1px solid #cbd5e1', borderRadius: '3px', cursor: 'pointer' }}
              >
                Balance Due ({customers.filter(c => (c.balance || 0) > 0).length})
              </button>
              <button
                type="button"
                onClick={() => setCustomerFilter('RETAIL')}
                style={{ flex: 1, padding: '4px', fontSize: '10.5px', fontWeight: 'bold', background: customerFilter === 'RETAIL' ? '#15803d' : '#fff', color: customerFilter === 'RETAIL' ? '#fff' : '#0f172a', border: '1px solid #cbd5e1', borderRadius: '3px', cursor: 'pointer' }}
              >
                Retail ({customers.filter(c => !c.gstin).length})
              </button>
            </div>

            {/* Select All Controls */}
            <div style={{ padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>
                Selected: {selectedCustomers.length} / {filteredCustomers.length}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="button" onClick={selectAll} style={{ background: 'none', border: 'none', color: '#15803d', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Select All</button>
                <button type="button" onClick={deselectAll} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Clear</button>
              </div>
            </div>

            {/* Customer List with Status */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
              {filteredCustomers.map(cust => {
                const isSelected = selectedCustomerIds.includes(cust.id);
                const isSent = sentCustomerIds.includes(cust.id);
                return (
                  <div
                    key={cust.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      background: isSent ? '#f0fdf4' : isSelected ? '#ffffff' : '#f8fafc',
                      border: isSent ? '1px solid #86efac' : isSelected ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
                      marginBottom: '4px'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectCustomer(cust.id)}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cust.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>
                        📞 {cust.phone || 'No phone'} | {cust.state || 'Kerala'}
                        {cust.balance > 0 && <span style={{ color: '#dc2626', marginLeft: '6px', fontWeight: 'bold' }}>Due: ₹{cust.balance}</span>}
                      </div>
                    </div>

                    {isSent ? (
                      <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '9.5px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '3px' }}>
                        ✓ Sent
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendToCustomer(cust)}
                        style={{
                          background: '#16a34a',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '3px',
                          padding: '2px 6px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        Send
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Message Template & Campaign Dispatcher */}
          <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', background: '#ffffff' }}>
            {/* Quick Templates */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Choose Pre-made Campaign Message:
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMessageTemplate(tmpl.text)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      fontSize: '10.5px',
                      fontWeight: 'bold',
                      color: '#0f172a',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Editor */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>
                  WhatsApp Message Template (Markdown supported):
                </label>
                <span style={{ fontSize: '10px', color: '#64748b' }}>
                  Tags: <code>{'{customer_name}'}</code>, <code>{'{balance}'}</code>, <code>{'{company_name}'}</code>
                </span>
              </div>
              <textarea
                style={{
                  width: '100%',
                  height: '180px',
                  fontFamily: 'monospace',
                  fontSize: '11.5px',
                  padding: '10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  lineHeight: '1.4'
                }}
                value={messageTemplate}
                onChange={e => setMessageTemplate(e.target.value)}
              />
            </div>

            {/* Live Message Preview for First Selected Customer */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#166534', marginBottom: '6px' }}>
                📱 Live Message Preview (as will be received on WhatsApp):
              </div>
              <div style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '11px',
                whiteSpace: 'pre-wrap',
                fontFamily: 'sans-serif',
                color: '#1e293b',
                lineHeight: '1.4'
              }}>
                {selectedCustomers.length > 0 ? (
                  formatMessageForCustomer(selectedCustomers[0])
                ) : (
                  'Select at least one customer to view personalized preview.'
                )}
              </div>
            </div>

            {/* Campaign Progress & Fast Sender */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>
                  Campaign Progress: {sentCustomerIds.length} / {selectedCustomers.length} Sent
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                  Click below to sequentially launch WhatsApp for each customer in your selected queue.
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextQuickSend}
                style={{
                  background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 18px',
                  fontSize: '12px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
              >
                <span>💬</span>
                <span>Launch Next WhatsApp ({selectedCustomers.length - sentCustomerIds.filter(id => selectedCustomerIds.includes(id)).length} Remaining)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 16px', background: '#f1f5f9', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Broadcasting to <strong>{selectedCustomers.length}</strong> recipients | <strong>{sentCustomerIds.length}</strong> sent in this session.
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
