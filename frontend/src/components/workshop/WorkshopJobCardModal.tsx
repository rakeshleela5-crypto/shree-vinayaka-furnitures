import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Wrench,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Trash2,
  Printer,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  RefreshCw
} from 'lucide-react';
import {
  fetchWorkshopJobCards,
  createWorkshopJobCard,
  advanceWorkshopJobCardStage,
  deleteWorkshopJobCard,
  type WorkshopJobCardItem
} from '../../api/client';

interface WorkshopJobCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  customers?: any[];
  products?: any[];
}

export type WorkshopStage =
  | 'DESIGN_LOCKED'
  | 'WOOD_FRAME'
  | 'WEBBING_FOAM'
  | 'FABRIC_UPHOLSTERY'
  | 'QC_VERIFIED'
  | 'READY_FOR_DISPATCH';

interface StageMeta {
  key: WorkshopStage;
  label: string;
  shortLabel: string;
  icon: any;
  color: string;
  bg: string;
  border: string;
}

const STAGES: StageMeta[] = [
  {
    key: 'DESIGN_LOCKED',
    label: '1. DESIGN LOCKED',
    shortLabel: 'Design Locked',
    icon: Clock,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-300'
  },
  {
    key: 'WOOD_FRAME',
    label: '2. WOOD FRAME',
    shortLabel: 'Wood Frame',
    icon: Layers,
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-300'
  },
  {
    key: 'WEBBING_FOAM',
    label: '3. WEBBING & FOAM',
    shortLabel: 'Webbing & Foam',
    icon: Sparkles,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-300'
  },
  {
    key: 'FABRIC_UPHOLSTERY',
    label: '4. UPHOLSTERY',
    shortLabel: 'Fabric / Upholstery',
    icon: Wrench,
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-300'
  },
  {
    key: 'QC_VERIFIED',
    label: '5. QC VERIFIED',
    shortLabel: 'QC Verified',
    icon: ShieldCheck,
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-300'
  },
  {
    key: 'READY_FOR_DISPATCH',
    label: '6. READY FOR DISPATCH',
    shortLabel: 'Ready for Dispatch',
    icon: PackageCheck,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300'
  }
];

export function WorkshopJobCardModal({ isOpen, onClose, showToast, customers = [], products = [] }: WorkshopJobCardModalProps) {
  const [jobCards, setJobCards] = useState<WorkshopJobCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStageFilter, setActiveStageFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    product_name: '',
    invoice_no: '',
    frame_wood: 'Treated Teak / Silver Oak',
    cushioning: '40 Density Sleepwell PU Foam',
    upholstery_code: "D'Decor Series 402 Velvet (Teal #08)",
    dimensions_orientation: 'L-Shape Left Lounger (108x68x34 in)',
    target_completion_date: '',
    delivery_promise_date: '',
    technician_name: 'Master Craftsman Murugan',
    notes: '',
    estimated_cost: 32000,
    advance_paid: 15000
  });

  // Print Traveler state
  const [selectedTraveler, setSelectedTraveler] = useState<WorkshopJobCardItem | null>(null);

  const loadJobCards = async () => {
    setIsLoading(true);
    try {
      const data = await fetchWorkshopJobCards();
      setJobCards(data);
    } catch (err: any) {
      if (showToast) showToast('Failed to load workshop job cards', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadJobCards();
    }
  }, [isOpen]);

  // Escape key handler to close sub-modals or close workshop modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCreateModal || selectedTraveler) {
          setShowCreateModal(false);
          setSelectedTraveler(null);
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showCreateModal, selectedTraveler, onClose]);

  const filteredCards = useMemo(() => {
    return jobCards.filter(card => {
      const matchStage = activeStageFilter === 'ALL' || card.stage === activeStageFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        card.job_card_no.toLowerCase().includes(q) ||
        card.customer_name.toLowerCase().includes(q) ||
        card.product_name.toLowerCase().includes(q) ||
        (card.upholstery_code && card.upholstery_code.toLowerCase().includes(q)) ||
        (card.invoice_no && card.invoice_no.toLowerCase().includes(q));
      return matchStage && matchSearch;
    });
  }, [jobCards, activeStageFilter, searchQuery]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: jobCards.length };
    STAGES.forEach(s => {
      counts[s.key] = jobCards.filter(c => c.stage === s.key).length;
    });
    return counts;
  }, [jobCards]);

  const handleAdvance = async (card: WorkshopJobCardItem) => {
    const currIdx = STAGES.findIndex(s => s.key === card.stage);
    if (currIdx < STAGES.length - 1) {
      const nextStage = STAGES[currIdx + 1].key;
      try {
        await advanceWorkshopJobCardStage(card.id, nextStage);
        if (showToast) showToast(`Job Card ${card.job_card_no} advanced to ${nextStage}`, 'success');
        loadJobCards();
      } catch (err: any) {
        if (showToast) showToast(err.message || 'Error updating stage', 'error');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this Workshop Job Card?')) return;
    try {
      await deleteWorkshopJobCard(id);
      if (showToast) showToast('Job card removed', 'success');
      loadJobCards();
    } catch (err: any) {
      if (showToast) showToast(err.message || 'Error deleting card', 'error');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name.trim() || !formData.product_name.trim()) {
      alert('Please fill in customer name and product title.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createWorkshopJobCard(formData);
      if (showToast) showToast('Custom Workshop Job Card created successfully!', 'success');
      setShowCreateModal(false);
      setFormData({
        customer_name: '',
        customer_phone: '',
        product_name: '',
        invoice_no: '',
        frame_wood: 'Treated Teak / Silver Oak',
        cushioning: '40 Density Sleepwell PU Foam',
        upholstery_code: "D'Decor Series 402 Velvet (Teal #08)",
        dimensions_orientation: 'L-Shape Left Lounger (108x68x34 in)',
        target_completion_date: '',
        delivery_promise_date: '',
        technician_name: 'Master Craftsman Murugan',
        notes: '',
        estimated_cost: 32000,
        advance_paid: 15000
      });
      loadJobCards();
    } catch (err: any) {
      if (showToast) showToast(err.message || 'Failed to create job card', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintTraveler = (card: WorkshopJobCardItem) => {
    setSelectedTraveler(card);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-6xl h-[92vh] rounded-lg shadow-2xl flex flex-col overflow-hidden border border-slate-300">
        
        {/* TOP HEADER */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-md">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">
                  Workshop & Factory Job Cards
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Made-to-Order MTO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Custom furniture production tracking (Wood Framing ➔ Foam Webbing ➔ Upholstery ➔ QC ➔ Dispatch)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              New Job Card
            </button>
            <button
              onClick={loadJobCards}
              disabled={isLoading}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-lg transition active:scale-95 border-2 border-red-400 cursor-pointer"
              title="Close Workshop Job Cards [Esc]"
            >
              <X className="w-4 h-4 stroke-[3]" />
              <span>EXIT [Esc]</span>
            </button>
          </div>
        </div>

        {/* STAGE METRIC TABS */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveStageFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                activeStageFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              All Cards ({stageCounts['ALL'] || 0})
            </button>

            {STAGES.map(s => {
              const count = stageCounts[s.key] || 0;
              const isActive = activeStageFilter === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveStageFilter(s.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all border ${
                    isActive
                      ? `${s.bg} ${s.color} ${s.border} ring-2 ring-teal-500/30 font-bold`
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{s.shortLabel}</span>
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                    isActive ? 'bg-white shadow-xs' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* SEARCH INPUT & EXIT ACTION */}
          <div className="flex items-center gap-2 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search JC#, customer, fabric..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow border border-red-500 cursor-pointer whitespace-nowrap"
              title="Close Workshop Job Cards [Esc]"
            >
              <X className="w-3.5 h-3.5 stroke-[3]" />
              <span>Exit [Esc]</span>
            </button>
          </div>
        </div>

        {/* MAIN BODY: JOB CARDS LIST */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {filteredCards.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <Layers className="w-12 h-12 mb-3 text-slate-300" />
              <p className="text-sm font-medium">No workshop job cards match your criteria.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded shadow hover:bg-teal-500"
              >
                + Create Custom Job Card
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCards.map(card => {
                const stageMeta = STAGES.find(s => s.key === card.stage) || STAGES[0];
                const currIdx = STAGES.findIndex(s => s.key === card.stage);
                const isFinal = currIdx === STAGES.length - 1;
                const nextStageMeta = !isFinal ? STAGES[currIdx + 1] : null;

                return (
                  <div
                    key={card.id}
                    className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
                  >
                    {/* CARD HEADER */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                          {card.job_card_no}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${stageMeta.bg} ${stageMeta.color} ${stageMeta.border}`}>
                          {stageMeta.shortLabel}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 leading-tight">
                        {card.product_name}
                      </h3>
                      
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                        <span>Customer: <strong className="text-slate-800">{card.customer_name}</strong></span>
                        {card.invoice_no && (
                          <span className="text-[11px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-200 font-mono">
                            {card.invoice_no}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CARD DETAILS */}
                    <div className="p-4 text-xs space-y-2 flex-1">
                      <div className="grid grid-cols-2 gap-2 text-slate-600">
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                          <span className="block text-[10px] uppercase font-bold text-slate-400">Frame Wood</span>
                          <span className="font-medium text-slate-800">{card.frame_wood}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                          <span className="block text-[10px] uppercase font-bold text-slate-400">Foam / Density</span>
                          <span className="font-medium text-slate-800">{card.cushioning}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Fabric & Swatch Reference</span>
                        <span className="font-semibold text-purple-900">{card.upholstery_code}</span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Dimensions & Lounger Layout</span>
                        <span className="font-medium text-slate-800">{card.dimensions_orientation}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                        <span>Lead Craftsman: <strong className="text-slate-700">{card.technician_name}</strong></span>
                        {card.delivery_promise_date && (
                          <span className="flex items-center gap-1 text-orange-700 font-semibold">
                            <Calendar className="w-3 h-3" />
                            Promise: {card.delivery_promise_date}
                          </span>
                        )}
                      </div>

                      {/* 6-STAGE PROGRESS BAR */}
                      <div className="pt-2">
                        <div className="grid grid-cols-6 gap-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          {STAGES.map((s, idx) => (
                            <div
                              key={s.key}
                              className={`h-full rounded-full transition-colors ${
                                idx <= currIdx ? 'bg-teal-500' : 'bg-slate-200'
                              }`}
                              title={s.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* CARD ACTIONS */}
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handlePrintTraveler(card)}
                          className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200"
                          title="Print Workshop Production Slip / Traveler"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(card.id)}
                          className="p-1.5 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200"
                          title="Delete Job Card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {!isFinal && nextStageMeta && (
                        <button
                          onClick={() => handleAdvance(card)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded shadow transition-all"
                        >
                          <span>Advance ➔ {nextStageMeta.shortLabel}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {isFinal && (
                        <span className="flex items-center gap-1 text-emerald-700 text-xs font-bold px-2 py-1 bg-emerald-50 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ready for Truck
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Persistent Bottom Status & Exit Footer */}
        <div className="px-6 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-300">
              Total Job Cards: <strong className="text-white">{jobCards.length}</strong>
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline text-slate-400">
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px] border border-slate-700">Esc</kbd> anytime to return to Desktop
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black transition shadow border border-red-500 cursor-pointer"
            title="Exit Workshop [Esc]"
          >
            <X className="w-3.5 h-3.5 stroke-[3]" />
            <span>EXIT [Esc]</span>
          </button>
        </div>

        {/* CREATE MODAL DRAWER */}
        {showCreateModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-lg shadow-xl border border-slate-300 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-teal-400" />
                  <h3 className="font-bold text-sm">Create Made-to-Order Workshop Job Card</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow border border-red-500 cursor-pointer"
                  title="Close [Esc]"
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                  <span>EXIT [Esc]</span>
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-5 overflow-y-auto space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      list="ws-customer-list"
                      placeholder="e.g. Ramesh Varma"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                      value={formData.customer_name}
                      onChange={e => {
                        const val = e.target.value;
                        const found = customers.find((c: any) => c.name?.toLowerCase() === val.toLowerCase());
                        setFormData(prev => ({
                          ...prev,
                          customer_name: val,
                          customer_phone: found ? (found.phone || found.contactNo || prev.customer_phone) : prev.customer_phone
                        }));
                      }}
                    />
                    <datalist id="ws-customer-list">
                      {customers.map((c: any) => (
                        <option key={c.id || c.code} value={c.name}>{c.phone ? `(${c.phone})` : ''}</option>
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Customer Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. 9845012345"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                      value={formData.customer_phone}
                      onChange={e => setFormData({ ...formData, customer_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Custom Furniture Title *</label>
                    <input
                      type="text"
                      required
                      list="ws-product-list"
                      placeholder="e.g. Chesterfield 3-Seater L-Shape"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                      value={formData.product_name}
                      onChange={e => {
                        const val = e.target.value;
                        const found = products.find((p: any) => p.name?.toLowerCase() === val.toLowerCase());
                        setFormData(prev => ({
                          ...prev,
                          product_name: val,
                          estimated_cost: found ? (found.retailPrice || found.mrp || prev.estimated_cost) : prev.estimated_cost
                        }));
                      }}
                    />
                    <datalist id="ws-product-list">
                      {products.map((p: any) => (
                        <option key={p.id || p.pCode || p.barcode} value={p.name}>{p.retailPrice ? `₹${p.retailPrice}` : ''}</option>
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Linked Invoice / Booking No</label>
                    <input
                      type="text"
                      placeholder="e.g. SVF-2627-0085 (Optional)"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                      value={formData.invoice_no}
                      onChange={e => setFormData({ ...formData, invoice_no: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Frame Wood Specification</label>
                    <select
                      className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                      value={formData.frame_wood}
                      onChange={e => setFormData({ ...formData, frame_wood: e.target.value })}
                    >
                      <option value="Treated Teak / Silver Oak">Treated Teak / Silver Oak</option>
                      <option value="Solid Sheesham Wood (Rosewood)">Solid Sheesham Wood (Rosewood)</option>
                      <option value="Kiln-Dried Solid Pine Wood">Kiln-Dried Solid Pine Wood</option>
                      <option value="Heavy Marine BWP Plywood Frame">Heavy Marine BWP Plywood Frame</option>
                      <option value="Imported Red Oak / Ash Wood">Imported Red Oak / Ash Wood</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cushioning & Spring Webbing</label>
                    <select
                      className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                      value={formData.cushioning}
                      onChange={e => setFormData({ ...formData, cushioning: e.target.value })}
                    >
                      <option value="40 Density Sleepwell PU Foam">40 Density Sleepwell PU Foam</option>
                      <option value="50 Density High Resilient (HR) Foam">50 Density High Resilient (HR) Foam</option>
                      <option value="Orthopedic Rebonded + Memory Foam Layer">Orthopedic Rebonded + Memory Foam Layer</option>
                      <option value="Pocket Spring Core + High Density Foam">Pocket Spring Core + High Density Foam</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fabric & Swatch Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. D'Decor Series 402 Velvet (Teal #08)"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                      value={formData.upholstery_code}
                      onChange={e => setFormData({ ...formData, upholstery_code: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dimensions & Lounger Orientation</label>
                    <input
                      type="text"
                      placeholder="e.g. L-Shape Left Lounger (108x68x34 in)"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                      value={formData.dimensions_orientation}
                      onChange={e => setFormData({ ...formData, dimensions_orientation: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Workshop Finish Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                      value={formData.target_completion_date}
                      onChange={e => setFormData({ ...formData, target_completion_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Customer Delivery Promise Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                      value={formData.delivery_promise_date}
                      onChange={e => setFormData({ ...formData, delivery_promise_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Lead Craftsman</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                      value={formData.technician_name}
                      onChange={e => setFormData({ ...formData, technician_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Estimated Cost (₹)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                      value={formData.estimated_cost}
                      onChange={e => setFormData({ ...formData, estimated_cost: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Advance Tendered (₹)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                      value={formData.advance_paid}
                      onChange={e => setFormData({ ...formData, advance_paid: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Special Crafting & Polish Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Include matching 2 velvet bolster cushions. Extra lacquer coat on armrest."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded shadow transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Issue Job Card'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* HIDDEN PRINT PRODUCTION TRAVELER SLIP */}
        {selectedTraveler && (
          <div className="hidden print:block fixed inset-0 bg-white p-8 text-black z-[999999]">
            <div style={{ border: '2px solid #000', padding: '16px', maxWidth: '750px', margin: '0 auto', fontFamily: 'sans-serif' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>SHREE VINAYAKA FURNITURES</h1>
                <p style={{ fontSize: '11px', margin: '2px 0' }}>FACTORY WORKSHOP & PRODUCTION TRAVELER SLIP</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px' }}>
                  <span><strong>Job Card No:</strong> {selectedTraveler.job_card_no}</span>
                  <span><strong>Date Issued:</strong> {selectedTraveler.date}</span>
                  <span><strong>Invoice:</strong> {selectedTraveler.invoice_no || 'Advance Booking'}</span>
                </div>
              </div>

              <div style={{ marginTop: '12px', borderBottom: '1px solid #ccc', paddingBottom: '10px', fontSize: '12px' }}>
                <p><strong>Customer:</strong> {selectedTraveler.customer_name} ({selectedTraveler.customer_phone || 'N/A'})</p>
                <p><strong>Custom Furniture:</strong> {selectedTraveler.product_name}</p>
                <p><strong>Delivery Promise Date:</strong> {selectedTraveler.delivery_promise_date || 'Standard Lead Time'}</p>
              </div>

              <div style={{ marginTop: '12px', borderBottom: '1px solid #ccc', paddingBottom: '10px', fontSize: '11px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '6px' }}>CRAFTING & MATERIAL SPECIFICATIONS</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '40%', padding: '4px', border: '1px solid #ddd' }}><strong>Frame Wood:</strong></td>
                      <td style={{ padding: '4px', border: '1px solid #ddd' }}>{selectedTraveler.frame_wood}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px', border: '1px solid #ddd' }}><strong>Cushioning / Foam:</strong></td>
                      <td style={{ padding: '4px', border: '1px solid #ddd' }}>{selectedTraveler.cushioning}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px', border: '1px solid #ddd' }}><strong>Fabric & Swatch:</strong></td>
                      <td style={{ padding: '4px', border: '1px solid #ddd' }}>{selectedTraveler.upholstery_code}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px', border: '1px solid #ddd' }}><strong>Dimensions / Orientation:</strong></td>
                      <td style={{ padding: '4px', border: '1px solid #ddd' }}>{selectedTraveler.dimensions_orientation}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px', border: '1px solid #ddd' }}><strong>Lead Craftsman:</strong></td>
                      <td style={{ padding: '4px', border: '1px solid #ddd' }}>{selectedTraveler.technician_name}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* STAGES CHECKLIST */}
              <div style={{ marginTop: '12px', fontSize: '11px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '6px' }}>WORKSHOP STAGE SIGN-OFF</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={{ border: '1px solid #000', padding: '6px' }}>Stage</th>
                      <th style={{ border: '1px solid #000', padding: '6px' }}>Craftsman Sign</th>
                      <th style={{ border: '1px solid #000', padding: '6px' }}>Date</th>
                      <th style={{ border: '1px solid #000', padding: '6px' }}>QC Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STAGES.map(s => (
                      <tr key={s.key}>
                        <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>{s.label}</td>
                        <td style={{ border: '1px solid #000', padding: '6px' }}></td>
                        <td style={{ border: '1px solid #000', padding: '6px' }}></td>
                        <td style={{ border: '1px solid #000', padding: '6px' }}></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', paddingTop: '20px' }}>
                <span>Craftsman Signature: __________________</span>
                <span>QC Inspector: __________________</span>
                <span>Store Manager: __________________</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
