import React, { useState, useEffect, useMemo } from 'react';
import type { CrmLead, CrmLeadStatus, CustomerDeliveryReview, SalesmanRecord } from '../../types/retailDaddy';

interface CrmLeadsFollowupModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: CrmLead[];
  onUpdateLeads: (leads: CrmLead[]) => void;
  reviews: CustomerDeliveryReview[];
  onUpdateReviews: (reviews: CustomerDeliveryReview[]) => void;
  salesmen?: SalesmanRecord[];
  initialTab?: 'LEADS' | 'REVIEWS';
  onConvertToQuotation?: (lead: CrmLead) => void;
  onConvertToSale?: (lead: CrmLead) => void;
}

export const CrmLeadsFollowupModal: React.FC<CrmLeadsFollowupModalProps> = ({
  isOpen,
  onClose,
  leads,
  onUpdateLeads,
  reviews,
  onUpdateReviews,
  salesmen = [],
  initialTab = 'LEADS',
  onConvertToQuotation,
  onConvertToSale
}) => {
  const [activeTab, setActiveTab] = useState<'LEADS' | 'REVIEWS'>(initialTab);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  const [leadStatusFilter, setLeadStatusFilter] = useState<CrmLeadStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Lead Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustCity, setNewCustCity] = useState('Kozhikode');
  const [newStatus, setNewStatus] = useState<CrmLeadStatus>('HOT');
  const [newInterest, setNewInterest] = useState('');
  const [newBudget, setNewBudget] = useState<number | ''>(50000);
  const [newSalesman, setNewSalesman] = useState(salesmen[0]?.name || 'Arun Kumar (Senior Consultant)');
  const [newFollowUpDate, setNewFollowUpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [newNotes, setNewNotes] = useState('');
  const [newSource, setNewSource] = useState<'WALK_IN' | 'WHATSAPP_INQUIRY' | 'PHONE_CALL' | 'WEBSITE_PORTAL'>('WALK_IN');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchStatus = leadStatusFilter === 'ALL' || l.status === leadStatusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        l.customerName.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.furnitureInterest && l.furnitureInterest.toLowerCase().includes(q)) ||
        (l.city && l.city.toLowerCase().includes(q)) ||
        (l.assignedSalesman && l.assignedSalesman.toLowerCase().includes(q));
      return matchStatus && matchQuery;
    });
  }, [leads, leadStatusFilter, searchQuery]);

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const q = searchQuery.toLowerCase().trim();
      return !q ||
        r.customerName.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        r.deliveryNoteNo.toLowerCase().includes(q) ||
        r.invoiceNo.toLowerCase().includes(q);
    });
  }, [reviews, searchQuery]);

  // Lead Counts
  const counts = useMemo(() => ({
    all: leads.length,
    hot: leads.filter(l => l.status === 'HOT').length,
    warm: leads.filter(l => l.status === 'WARM').length,
    cold: leads.filter(l => l.status === 'COLD').length,
    converted: leads.filter(l => l.status === 'CONVERTED').length
  }), [leads]);

  if (!isOpen) return null;

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      showToast('⚠️ Please enter Customer Name and Phone Number');
      return;
    }

    const created: CrmLead = {
      id: `lead-${Date.now()}`,
      customerName: newCustName.trim(),
      phone: newCustPhone.trim(),
      email: newCustEmail.trim(),
      city: newCustCity.trim() || 'Kozhikode',
      status: newStatus,
      furnitureInterest: newInterest.trim() || 'Showroom Living Room & Bedroom Suite',
      estimatedBudget: Number(newBudget) || 0,
      assignedSalesman: newSalesman,
      followUpDate: newFollowUpDate,
      notes: newNotes.trim(),
      source: newSource,
      createdAt: new Date().toISOString()
    };

    onUpdateLeads([created, ...leads]);
    showToast(`✓ New ${newStatus} Lead added for ${created.customerName}`);
    setShowAddLeadModal(false);
    // Reset form
    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
    setNewInterest('');
    setNewNotes('');
  };

  const handleUpdateLeadStatus = (leadId: string, status: CrmLeadStatus) => {
    const updated = leads.map(l => l.id === leadId ? { ...l, status, lastContactedAt: new Date().toISOString() } : l);
    onUpdateLeads(updated);
    showToast(`✓ Lead status updated to ${status}`);
  };

  const handleSendWhatsAppLead = (lead: CrmLead) => {
    const phone = lead.phone.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hello ${lead.customerName},\n\nGreetings from Shree Vinayaka Furnitures (Authorised Godrej Interio Showroom, Kozhikode)!\n\n` +
      `We hope you are having a wonderful day. You recently inquired about: *${lead.furnitureInterest}*.\n\n` +
      `Our current showroom festival benefits include:\n` +
      `• 0% Interest EMI Options on Godrej Storwel & Kalista Beds\n` +
      `• Free Safe White-Glove Home Delivery & Assembly\n` +
      `• Direct Factory Warranty Protection\n\n` +
      `Would you like us to share photos, wood finish options, or a customized price quotation?\n\n` +
      `Best regards,\n${lead.assignedSalesman || 'Sales Team'}\nShree Vinayaka Furnitures\nPhone: +91 94484 22354`
    );
    const url = phone.length >= 10
      ? `https://api.whatsapp.com/send?phone=91${phone.slice(-10)}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
    showToast(`📱 Dispatched WhatsApp Follow-up to ${lead.customerName} (${lead.phone})`);
  };

  const handleSendReviewRequest = (rev: CustomerDeliveryReview) => {
    const phone = rev.phone.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Dear ${rev.customerName},\n\n` +
      `Thank you for purchasing with Shree Vinayaka Furnitures!\n` +
      `Your order (*${rev.productName}*) was delivered under Delivery Note *${rev.deliveryNoteNo}*.\n\n` +
      `We value your feedback deeply. How was your delivery and carpenter assembly experience?\n` +
      `⭐ Please reply with your rating from 1 to 5 stars, or click below to leave us a Google Showroom Review:\n` +
      `https://g.page/r/shree-vinayaka-furnitures/review\n\n` +
      `Thank you for trusting our showroom family!\nShree Vinayaka Furnitures • Godrej Interio\nPhone: +91 94484 22354`
    );
    const url = phone.length >= 10
      ? `https://api.whatsapp.com/send?phone=91${phone.slice(-10)}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
    
    // Mark review requested
    const updated = reviews.map(r => r.id === rev.id ? { ...r, reviewRequestedAt: new Date().toISOString() } : r);
    onUpdateReviews(updated);
    showToast(`📱 Dispatched Review Request to ${rev.customerName}`);
  };

  const handleUpdateRating = (revId: string, rating: number) => {
    const updated: CustomerDeliveryReview[] = reviews.map(r => r.id === revId ? {
      ...r,
      rating,
      status: (rating >= 4 ? 'SATISFIED' : 'FOLLOWUP_REQUIRED') as CustomerDeliveryReview['status']
    } : r);
    onUpdateReviews(updated);
    showToast(`⭐ Recorded ${rating}-Star Customer Rating!`);
  };

  return (
    <div
      className="rd-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(3px)'
      }}
    >
      <div
        className="rd-dialog"
        style={{
          width: '1100px',
          maxWidth: '96vw',
          height: '92vh',
          maxHeight: '880px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#0f172a] text-white px-4 py-2.5 flex items-center justify-between select-none">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎯</span>
            <div>
              <div className="font-extrabold text-sm tracking-wide">
                Showroom CRM Leads & Post-Delivery Customer Reviews Hub
              </div>
              <div className="text-[10px] text-blue-200">
                Shree Vinayaka Furnitures • Lead Pipeline (Hot / Warm / Cold) & Delivery CSAT Follow-up
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddLeadModal(true)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs flex items-center gap-1 shadow cursor-pointer"
            >
              <span>➕</span>
              <span>New Lead Intake</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMsg && (
          <div className="bg-emerald-50 text-emerald-800 border-b border-emerald-200 px-4 py-1.5 text-xs font-bold text-center">
            {toastMsg}
          </div>
        )}

        {/* Main Tab Navigation & Search Bar */}
        <div className="bg-slate-100 border-b border-slate-300 px-4 py-2 flex flex-wrap items-center justify-between gap-3">
          {/* Main Tabs */}
          <div className="flex items-center gap-1 bg-slate-200 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('LEADS')}
              className={`px-4 py-1.5 rounded font-extrabold text-xs transition cursor-pointer ${
                activeTab === 'LEADS' ? 'bg-[#1e3a8a] text-white shadow' : 'text-slate-700 hover:bg-slate-300'
              }`}
            >
              🎯 Showroom Leads Pipeline ({leads.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('REVIEWS')}
              className={`px-4 py-1.5 rounded font-extrabold text-xs transition cursor-pointer ${
                activeTab === 'REVIEWS' ? 'bg-[#0f766e] text-white shadow' : 'text-slate-700 hover:bg-slate-300'
              }`}
            >
              ⭐ Post-Delivery Reviews & CSAT ({reviews.length})
            </button>
          </div>

          {/* Quick Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder={activeTab === 'LEADS' ? '🔍 Search Customer, Phone, Item, Salesman...' : '🔍 Search Customer, Delivery Note, Item...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-72 bg-white border border-slate-300 px-3 py-1.5 rounded text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-slate-700 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab 1: CRM Leads Pipeline */}
        {activeTab === 'LEADS' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Status Pills */}
            <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center gap-2 overflow-x-auto select-none">
              <span className="text-xs font-bold text-slate-600 mr-1">Status Filter:</span>
              {[
                { key: 'ALL', label: `All Leads (${counts.all})`, color: 'bg-slate-800 text-white' },
                { key: 'HOT', label: `🔥 Hot Leads (${counts.hot})`, color: 'bg-red-600 text-white' },
                { key: 'WARM', label: `☀️ Warm Leads (${counts.warm})`, color: 'bg-amber-600 text-white' },
                { key: 'COLD', label: `❄️ Cold Leads (${counts.cold})`, color: 'bg-blue-600 text-white' },
                { key: 'CONVERTED', label: `✓ Converted (${counts.converted})`, color: 'bg-emerald-700 text-white' }
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setLeadStatusFilter(opt.key as any)}
                  className={`px-3 py-1 rounded-full text-xs font-extrabold cursor-pointer transition ${
                    leadStatusFilter === opt.key ? opt.color + ' ring-2 ring-offset-1 ring-slate-400 shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Leads List Table */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredLeads.map(lead => (
                  <div
                    key={lead.id}
                    className="bg-white border rounded-lg p-3.5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                    style={{
                      borderLeftWidth: '5px',
                      borderLeftColor:
                        lead.status === 'HOT' ? '#dc2626' :
                        lead.status === 'WARM' ? '#d97706' :
                        lead.status === 'COLD' ? '#2563eb' :
                        lead.status === 'CONVERTED' ? '#15803d' : '#64748b'
                    }}
                  >
                    <div>
                      {/* Top Row: Customer Name, Status Badge, Budget */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <div className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                            <span>{lead.customerName}</span>
                            <span className="text-[10px] text-slate-500 font-mono font-normal">
                              ({lead.city || 'Kozhikode'})
                            </span>
                          </div>
                          <div className="text-xs text-blue-900 font-mono font-bold">
                            📞 {lead.phone}
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              lead.status === 'HOT' ? 'bg-red-100 text-red-700 border border-red-300' :
                              lead.status === 'WARM' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              lead.status === 'COLD' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                              'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            {lead.status === 'HOT' ? '🔥 Hot Lead' :
                             lead.status === 'WARM' ? '☀️ Warm Lead' :
                             lead.status === 'COLD' ? '❄️ Cold Lead' : '✓ Converted'}
                          </span>
                          <div className="text-xs font-black text-emerald-700 mt-0.5">
                            Est: ₹{lead.estimatedBudget.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Furniture Item of Interest */}
                      <div className="bg-slate-50 border border-slate-200 rounded p-2 my-2 text-xs">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Interested Furniture:</div>
                        <div className="font-bold text-slate-800">{lead.furnitureInterest}</div>
                        {lead.notes && (
                          <div className="text-[11px] text-slate-600 mt-1 italic">
                            "{lead.notes}"
                          </div>
                        )}
                      </div>

                      {/* Metadata row */}
                      <div className="text-[10px] text-slate-500 flex flex-wrap justify-between gap-1 mb-2 font-medium">
                        <span>👤 Rep: <b>{lead.assignedSalesman}</b></span>
                        <span>📅 Follow-up: <b className="text-red-700">{lead.followUpDate}</b></span>
                        <span>Source: <b>{lead.source}</b></span>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="border-t border-slate-100 pt-2 flex flex-wrap items-center justify-between gap-1.5">
                      {/* Status Selector */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-500">Move:</span>
                        {(['HOT', 'WARM', 'COLD', 'CONVERTED'] as CrmLeadStatus[]).map(st => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleUpdateLeadStatus(lead.id, st)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                              lead.status === st ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      {/* 1-Click Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppLead(lead)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                          title="Send pre-filled WhatsApp follow-up offer"
                        >
                          <span>💬</span>
                          <span>WhatsApp</span>
                        </button>

                        {onConvertToQuotation && (
                          <button
                            type="button"
                            onClick={() => {
                              onConvertToQuotation(lead);
                              onClose();
                            }}
                            className="px-2 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                            title="Generate official Price Quotation for this customer"
                          >
                            <span>📑</span>
                            <span>Quote</span>
                          </button>
                        )}

                        {onConvertToSale && (
                          <button
                            type="button"
                            onClick={() => {
                              onConvertToSale(lead);
                              onClose();
                            }}
                            className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                            title="Directly bill in POS"
                          >
                            <span>🛒</span>
                            <span>Bill</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredLeads.length === 0 && (
                  <div className="col-span-2 py-12 text-center text-slate-500 italic bg-white rounded-lg border border-dashed border-slate-300">
                    No leads match the selected filter. Click "➕ New Lead Intake" to register showroom visitors.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Post-Delivery Reviews & CSAT Follow-up */}
        {activeTab === 'REVIEWS' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 p-4">
            <div className="bg-white border rounded-lg p-3 mb-3 shadow-xs flex items-center justify-between">
              <div>
                <span className="font-extrabold text-xs text-slate-800">
                  Customer Delivery Follow-up & Google Reviews Pipeline
                </span>
                <p className="text-[11px] text-slate-500">
                  Send 1-click WhatsApp review requests post-delivery and track CSAT satisfaction.
                </p>
              </div>
              <div className="flex gap-4 text-xs font-bold text-slate-700">
                <span>Total Deliveries: <b>{reviews.length}</b></span>
                <span className="text-emerald-700">Satisfied: <b>{reviews.filter(r => r.rating >= 4).length}</b></span>
                <span className="text-amber-700">Pending: <b>{reviews.filter(r => r.rating === 0).length}</b></span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {filteredReviews.map(rev => (
                <div
                  key={rev.id}
                  className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm hover:shadow transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-sm">{rev.customerName}</span>
                      <span className="font-mono text-xs text-blue-900 font-bold">📞 {rev.phone}</span>
                      <span className="px-2 py-0.5 bg-slate-100 border text-[10px] font-mono rounded text-slate-700">
                        {rev.deliveryNoteNo}
                      </span>
                    </div>

                    <div className="text-xs text-slate-800 font-semibold mt-1">
                      📦 {rev.productName}
                    </div>

                    <div className="text-[10px] text-slate-500 flex gap-4 mt-1">
                      <span>Delivery Date: <b>{rev.deliveryDate}</b></span>
                      <span>Technician: <b>{rev.technicianName || 'Manoj Carpenter'}</b></span>
                      {rev.reviewRequestedAt && (
                        <span className="text-emerald-700 font-bold">
                          ✓ Review Request Dispatched
                        </span>
                      )}
                    </div>

                    {rev.feedbackNotes && (
                      <div className="mt-1.5 text-xs text-slate-600 bg-amber-50 border border-amber-200 rounded px-2 py-1 italic">
                        "{rev.feedbackNotes}"
                      </div>
                    )}
                  </div>

                  {/* Rating & Actions */}
                  <div className="flex flex-col items-end gap-2">
                    {/* Star Rating Selector */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-600 mr-1">Rating:</span>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleUpdateRating(rev.id, star)}
                          className={`text-lg cursor-pointer transition ${
                            star <= rev.rating ? 'text-amber-400 hover:scale-110' : 'text-slate-300 hover:text-amber-300'
                          }`}
                          title={`Rate ${star} Stars`}
                        >
                          ★
                        </button>
                      ))}
                      <span className="font-black text-xs text-slate-800 ml-1">
                        {rev.rating > 0 ? `${rev.rating}/5` : 'Unrated'}
                      </span>
                    </div>

                    {/* WhatsApp Action */}
                    <button
                      type="button"
                      onClick={() => handleSendReviewRequest(rev)}
                      className="px-3 py-1.5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>💬</span>
                      <span>Request Review on WhatsApp</span>
                    </button>
                  </div>
                </div>
              ))}

              {filteredReviews.length === 0 && (
                <div className="p-8 text-center text-slate-500 italic bg-white rounded border border-dashed">
                  No delivery review records found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="bg-slate-900 text-slate-300 px-4 py-2 flex items-center justify-between text-xs select-none">
          <span>Showroom CRM & CSAT Engine • Synchronized with POS & Delivery Notes</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-bold cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>

      {/* Quick Add Lead Intake Dialog */}
      {showAddLeadModal && (
        <div
          className="rd-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.8)'
          }}
        >
          <div className="bg-white rounded-lg shadow-2xl w-[520px] max-w-[95vw] overflow-hidden">
            <div className="bg-[#1e3a8a] text-white px-4 py-2.5 flex items-center justify-between font-bold text-xs">
              <span>➕ Register New Showroom Visitor / Lead</span>
              <button
                type="button"
                onClick={() => setShowAddLeadModal(false)}
                className="text-white hover:text-red-300 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Pillai"
                    value={newCustName}
                    onChange={e => setNewCustName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-bold text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Mobile No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9847012345"
                    value={newCustPhone}
                    onChange={e => setNewCustPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">City / Location</label>
                  <input
                    type="text"
                    value={newCustCity}
                    onChange={e => setNewCustCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Lead Temperature</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as CrmLeadStatus)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-bold text-slate-900"
                  >
                    <option value="HOT">🔥 Hot (Ready to Buy 24-48h)</option>
                    <option value="WARM">☀️ Warm (Comparing / Interested)</option>
                    <option value="COLD">❄️ Cold (Future Home Project)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-0.5">Furniture Interest / Products</label>
                <input
                  type="text"
                  placeholder="e.g. Godrej Slimline 3-Door Almirah + King Size Teak Bed"
                  value={newInterest}
                  onChange={e => setNewInterest(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Estimated Budget (₹)</label>
                  <input
                    type="number"
                    value={newBudget}
                    onChange={e => setNewBudget(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Follow-up Date</label>
                  <input
                    type="date"
                    value={newFollowUpDate}
                    onChange={e => setNewFollowUpDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Assigned Salesman</label>
                  <input
                    type="text"
                    value={newSalesman}
                    onChange={e => setNewSalesman(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Lead Source</label>
                  <select
                    value={newSource}
                    onChange={e => setNewSource(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900"
                  >
                    <option value="WALK_IN">🚶 Showroom Walk-in</option>
                    <option value="WHATSAPP_INQUIRY">💬 WhatsApp Inquiry</option>
                    <option value="PHONE_CALL">📞 Phone Call</option>
                    <option value="WEBSITE_PORTAL">🌐 Website Portal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-0.5">Specific Requirements / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Wants Pacific Blue colour, delivery required on 2nd floor with lift."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow cursor-pointer"
                >
                  ✓ Save Lead to Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
