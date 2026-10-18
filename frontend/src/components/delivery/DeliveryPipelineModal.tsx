import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Truck,
  Wrench,
  CheckCircle2,
  Clock,
  Star,
  RefreshCw,
  Search,
  MessageSquare,
  Phone,
  MapPin,
  AlertTriangle,
  ChevronRight,
  Zap,
  User,
  FileText,
  Boxes
} from 'lucide-react';
import {
  fetchDeliveryPipelineOrders,
  advanceDeliveryStage,
  logDeliveryCsat,
  generateDeliveryCsatWhatsApp,
  seedDeliveryPipelineSampleData
} from '../../api/client';
import type {
  DeliveryPipelineItem,
  DeliveryStage,
  DeliveryStageAdvancePayload,
  CsatFeedbackPayload
} from '../../types/retailDaddy';

interface DeliveryPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  onOpenAssemblyScanner?: () => void;
}

const STAGES: { key: DeliveryStage; label: string; icon: any; color: string; bg: string }[] = [
  { key: 'Booked', label: '1. Booked', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  { key: 'BoxVerified', label: '2. Box Verified', icon: Boxes, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
  { key: 'OutForDelivery', label: '3. Out for Delivery', icon: Truck, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  { key: 'AssemblyInProgress', label: '4. In Assembly', icon: Wrench, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  { key: 'Delivered', label: '5. Delivered', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  { key: 'Closed', label: '6. CSAT Logged', icon: Star, color: 'text-amber-300', bg: 'bg-amber-500/20 border-amber-500/40' },
];

export const DeliveryPipelineModal: React.FC<DeliveryPipelineModalProps> = ({
  isOpen,
  onClose,
  showToast,
  onOpenAssemblyScanner
}) => {
  const [orders, setOrders] = useState<DeliveryPipelineItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedStageTab, setSelectedStageTab] = useState<DeliveryStage | 'All'>('All');
  const [search, setSearch] = useState<string>('');

  // Advance Stage Modal
  const [advancingOrder, setAdvancingOrder] = useState<DeliveryPipelineItem | null>(null);
  const [targetStage, setTargetStage] = useState<DeliveryStage>('OutForDelivery');
  const [driverName, setDriverName] = useState<string>('Biju Kumar');
  const [driverPhone, setDriverPhone] = useState<string>('9447102030');
  const [vehicleNo, setVehicleNo] = useState<string>('KL-05-AR-4491');
  const [ewayBillNo, setEwayBillNo] = useState<string>('');
  const [technicianName, setTechnicianName] = useState<string>('Manoharan (Senior Carpenter)');
  const [technicianPhone, setTechnicianPhone] = useState<string>('9846203040');
  const [assemblyNotes, setAssemblyNotes] = useState<string>('');
  const [submittingStage, setSubmittingStage] = useState<boolean>(false);

  // CSAT Modal State
  const [csatOrder, setCsatOrder] = useState<DeliveryPipelineItem | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'On-Time Delivery',
    'Flawless Assembly',
    'Courteous Staff'
  ]);
  const [comments, setComments] = useState<string>('');
  const [submittingCsat, setSubmittingCsat] = useState<boolean>(false);

  const TAG_OPTIONS = [
    'On-Time Delivery',
    'Flawless Assembly',
    'Courteous Staff',
    'Careful Handling',
    'Explained Usage & Keys',
    'Delayed Delivery',
    'Damaged Packaging',
    'Missing Hardware / Screws',
    'Incomplete Assembly'
  ];

  const loadOrders = async () => {
    try {
      setLoading(true);
      const stageParam = selectedStageTab !== 'All' ? selectedStageTab : undefined;
      const data = await fetchDeliveryPipelineOrders(stageParam, search);
      setOrders(data);
    } catch (err: any) {
      console.error('Failed to load delivery pipeline orders:', err);
      showToast?.('Failed to load delivery pipeline: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadOrders();
    }
  }, [isOpen, selectedStageTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  const handleSeedDemo = async () => {
    try {
      setLoading(true);
      await seedDeliveryPipelineSampleData();
      showToast?.('✓ Realistic Godrej delivery orders seeded across all stages!', 'success');
      await loadOrders();
    } catch (err: any) {
      showToast?.('Failed to seed demo data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAdvanceModal = (order: DeliveryPipelineItem) => {
    setAdvancingOrder(order);
    let nextStage: DeliveryStage = 'OutForDelivery';
    if (order.stage === 'Booked') nextStage = 'BoxVerified';
    else if (order.stage === 'BoxVerified') nextStage = 'OutForDelivery';
    else if (order.stage === 'OutForDelivery') nextStage = 'AssemblyInProgress';
    else if (order.stage === 'AssemblyInProgress') nextStage = 'Delivered';
    else if (order.stage === 'Delivered') nextStage = 'Closed';

    setTargetStage(nextStage);
    setDriverName(order.driver_name || 'Biju Kumar');
    setDriverPhone(order.driver_phone || '9447102030');
    setVehicleNo(order.vehicle_no || 'KL-05-AR-4491');
    setEwayBillNo(order.eway_bill_no || '');
    setTechnicianName(order.technician_name || 'Manoharan (Senior Carpenter)');
    setTechnicianPhone(order.technician_phone || '9846203040');
    setAssemblyNotes(order.assembly_notes || '');
  };

  const handleAdvanceSubmit = async () => {
    if (!advancingOrder) return;
    try {
      setSubmittingStage(true);
      const payload: DeliveryStageAdvancePayload = {
        stage: targetStage,
        driver_name: driverName,
        driver_phone: driverPhone,
        vehicle_no: vehicleNo,
        eway_bill_no: ewayBillNo,
        technician_name: technicianName,
        technician_phone: technicianPhone,
        assembly_notes: assemblyNotes
      };
      await advanceDeliveryStage(advancingOrder.id, payload);
      showToast?.(`✓ Order ${advancingOrder.delivery_note_no} advanced to ${targetStage}!`, 'success');
      setAdvancingOrder(null);
      await loadOrders();
    } catch (err: any) {
      showToast?.('Error advancing stage: ' + err.message, 'error');
    } finally {
      setSubmittingStage(false);
    }
  };

  const openCsatModal = (order: DeliveryPipelineItem) => {
    setCsatOrder(order);
    setRating(order.csat_rating || 5);
    setSelectedTags(order.csat_tags ? order.csat_tags.split(',').map(s => s.trim()) : ['On-Time Delivery', 'Flawless Assembly']);
    setComments(order.csat_feedback || '');
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleCsatSubmit = async () => {
    if (!csatOrder) return;
    try {
      setSubmittingCsat(true);
      const payload: CsatFeedbackPayload = {
        rating,
        tags: selectedTags.join(', '),
        feedback: comments,
        followup_status: rating <= 2 ? 'Escalated' : 'Satisfied'
      };
      await logDeliveryCsat(csatOrder.id, payload);
      if (rating <= 2) {
        showToast?.(`⚠️ CSAT logged (${rating}★). Auto-escalated to Store Manager for resolution!`, 'warning');
      } else {
        showToast?.(`✓ Customer CSAT logged: ${rating}★! Order marked complete.`, 'success');
      }
      setCsatOrder(null);
      await loadOrders();
    } catch (err: any) {
      showToast?.('Error logging CSAT: ' + err.message, 'error');
    } finally {
      setSubmittingCsat(false);
    }
  };

  const handleWhatsAppCsat = async (order: DeliveryPipelineItem) => {
    try {
      const data = await generateDeliveryCsatWhatsApp(order.id);
      window.open(data.whatsapp_url, '_blank');
      showToast?.('✓ WhatsApp customer follow-up chat opened!', 'info');
    } catch (err: any) {
      showToast?.('Error generating WhatsApp message: ' + err.message, 'error');
    }
  };

  const parseItems = (jsonStr: string) => {
    try {
      return JSON.parse(jsonStr);
    } catch {
      return [];
    }
  };

  // Group counts by stage
  const countsByStage = useMemo(() => {
    const map: Record<string, number> = { All: orders.length };
    STAGES.forEach(s => {
      map[s.key] = orders.filter(o => o.stage === s.key).length;
    });
    return map;
  }, [orders]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-7xl h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-inner">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  Godrej Dispatch, Knockdown Assembly & CSAT Pipeline
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  6-Stage Fulfillment
                </span>
              </div>
              <p className="text-xs text-slate-200 font-medium mt-0.5">
                Warehouse Pick ➔ Van Dispatch ➔ Carpenter Assembly ➔ Customer Handover ➔ 5-Star CSAT Feedback
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onOpenAssemblyScanner && (
              <button
                onClick={onOpenAssemblyScanner}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-200 text-xs font-semibold transition"
              >
                <Boxes className="w-3.5 h-3.5" />
                Scan Carton Barcodes
              </button>
            )}
            <button
              onClick={handleSeedDemo}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-200 text-xs font-medium transition"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Seed Demo Orders
            </button>
            <button
              onClick={loadOrders}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Refresh Pipeline"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stage Filter Tabs Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
            <button
              onClick={() => setSelectedStageTab('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                selectedStageTab === 'All'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Orders ({countsByStage['All'] ?? 0})
            </button>
            {STAGES.map(stage => {
              const Icon = stage.icon;
              const isActive = selectedStageTab === stage.key;
              const count = countsByStage[stage.key] ?? 0;
              return (
                <button
                  key={stage.key}
                  onClick={() => setSelectedStageTab(stage.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-600 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${stage.color}`} />
                  {stage.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer, note #, or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </form>
        </div>

        {/* Pipeline Cards Grid */}
        <div className="flex-1 overflow-auto p-4">
          {loading && orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
              <p className="text-sm">Loading delivery orders and live stage matrix...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
              <Truck className="w-12 h-12 text-slate-600" />
              <p className="text-base font-semibold text-slate-300">No delivery orders in this stage</p>
              <p className="text-xs text-slate-500 max-w-md text-center">
                Click "Seed Demo Orders" above to populate authentic Godrej furniture orders across Booked, Out for Delivery, Assembly in Progress, and CSAT Logged stages.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map(order => {
                const stageObj = STAGES.find(s => s.key === order.stage) || STAGES[0];
                const StageIcon = stageObj.icon;
                const items = parseItems(order.items_json);

                return (
                  <div
                    key={order.id}
                    className="flex flex-col justify-between p-4 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-slate-600 transition shadow-sm hover:shadow-md"
                  >
                    <div>
                      {/* Top Row: Note No & Stage Badge */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                        <div className="font-mono font-bold text-white text-xs flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-400" />
                          {order.delivery_note_no}
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${stageObj.bg} ${stageObj.color}`}>
                          <StageIcon className="w-3 h-3" />
                          {stageObj.label}
                        </span>
                      </div>

                      {/* Customer Details */}
                      <div className="mt-3">
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-300" />
                          {order.customer_name}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-200">
                          <Phone className="w-3 h-3 text-slate-300" />
                          <span className="font-mono font-semibold">{order.contact_no || 'No contact'}</span>
                          <span>•</span>
                          <span className="text-slate-200 font-semibold">{order.date}</span>
                        </div>
                        <div className="flex items-start gap-1.5 mt-1 text-[11px] text-slate-200 leading-snug">
                          <MapPin className="w-3 h-3 text-slate-300 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{order.delivery_address}</span>
                        </div>
                      </div>

                      {/* Furniture Items List */}
                      <div className="mt-3 p-2 rounded-lg bg-slate-950/70 border border-slate-700 text-xs">
                        <div className="font-bold text-slate-100 text-[11px] mb-1 flex items-center justify-between">
                          <span>Furniture Items:</span>
                          <span className="text-emerald-400 font-bold">
                            ₹{order.grand_total.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {items.map((it: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] text-slate-200 font-medium">
                              <span className="truncate max-w-[200px]" title={it.name || it.product_name}>
                                • {it.name || it.product_name}
                              </span>
                              <div className="flex items-center gap-2">
                                {it.boxes && (
                                  <span className="px-1.5 rounded bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-800 font-bold">
                                    {it.boxes} Cartons
                                  </span>
                                )}
                                <span className="font-mono text-white font-bold">x{it.qty || 1}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Logistics Info (Vehicle & Carpenter) */}
                      <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] bg-slate-900/80 p-2 rounded-lg border border-slate-700">
                        <div>
                          <span className="text-slate-300 font-semibold">Van / Driver:</span>
                          <div className="font-bold text-white truncate">
                            {order.driver_name || 'Unassigned'}
                          </div>
                          <div className="text-[10px] text-slate-300 font-mono font-semibold">
                            {order.vehicle_no || 'No vehicle'}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-300 font-semibold">Carpenter:</span>
                          <div className="font-bold text-white truncate">
                            {order.technician_name || 'Unassigned'}
                          </div>
                          <div className="text-[10px] text-purple-200 font-semibold">
                            {order.technician_phone ? 'Expert Assembly' : 'Standard'}
                          </div>
                        </div>
                      </div>

                      {/* CSAT Rating Preview if logged */}
                      {order.csat_rating && (
                        <div className="mt-3 p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-amber-300">Customer CSAT:</span>
                            <div className="flex items-center gap-0.5 text-amber-400">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${
                                    star <= (order.csat_rating || 0)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-600'
                                  }`}
                                />
                              ))}
                              <span className="font-bold ml-1 text-white">
                                {order.csat_rating}.0
                              </span>
                            </div>
                          </div>
                          {order.csat_tags && (
                            <div className="text-[10px] text-slate-400 mt-1">
                              Tags: {order.csat_tags}
                            </div>
                          )}
                          {order.csat_feedback && (
                            <p className="text-[11px] text-amber-200/90 italic mt-1 bg-amber-950/60 p-1.5 rounded border border-amber-900/40">
                              "{order.csat_feedback}"
                            </p>
                          )}
                          {order.csat_followup_status === 'Escalated' && (
                            <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                              <AlertTriangle className="w-3 h-3" />
                              Escalated to Store Manager for follow-up!
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleWhatsAppCsat(order)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition"
                        title="Send WhatsApp CSAT Rating Prompt to Customer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp
                      </button>

                      <div className="flex items-center gap-2">
                        {order.stage !== 'Closed' && (
                          <button
                            onClick={() => openCsatModal(order)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-semibold transition"
                            title="Record Customer 5-Star Rating & Feedback"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            CSAT
                          </button>
                        )}

                        <button
                          onClick={() => openAdvanceModal(order)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow"
                        >
                          <span>Advance</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal: Advance Stage & Assign Crew */}
        {advancingOrder && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-white text-base">Advance Pipeline Stage</h3>
                </div>
                <button
                  onClick={() => setAdvancingOrder(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                <div className="font-bold text-white text-sm">{advancingOrder.delivery_note_no}</div>
                <div className="text-slate-400 mt-1">
                  Customer: <strong className="text-slate-200">{advancingOrder.customer_name}</strong> • Phone: <strong className="text-slate-200">{advancingOrder.contact_no}</strong>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Select Next Stage:
                  </label>
                  <select
                    value={targetStage}
                    onChange={e => setTargetStage(e.target.value as DeliveryStage)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-blue-500"
                  >
                    {STAGES.map(s => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      🚚 Driver Name:
                    </label>
                    <input
                      type="text"
                      value={driverName}
                      onChange={e => setDriverName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      📞 Driver Phone:
                    </label>
                    <input
                      type="text"
                      value={driverPhone}
                      onChange={e => setDriverPhone(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      🚐 Vehicle Registration No:
                    </label>
                    <input
                      type="text"
                      value={vehicleNo}
                      onChange={e => setVehicleNo(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      📄 E-Way Bill Number:
                    </label>
                    <input
                      type="text"
                      value={ewayBillNo}
                      placeholder="e.g. 241188990123"
                      onChange={e => setEwayBillNo(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      🔧 Carpenter / Technician:
                    </label>
                    <input
                      type="text"
                      value={technicianName}
                      onChange={e => setTechnicianName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      📞 Carpenter Phone:
                    </label>
                    <input
                      type="text"
                      value={technicianPhone}
                      onChange={e => setTechnicianPhone(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    📝 Assembly Notes & Instructions:
                  </label>
                  <textarea
                    rows={2}
                    value={assemblyNotes}
                    onChange={e => setAssemblyNotes(e.target.value)}
                    placeholder="e.g. Deliver to 2nd floor, assemble on site, customer requires levelling test..."
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAdvancingOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAdvanceSubmit}
                  disabled={submittingStage}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submittingStage ? 'Advancing...' : 'Confirm Stage Update'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: CSAT Customer Feedback */}
        {csatOrder && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <h3 className="font-bold text-white text-base">Record Customer CSAT</h3>
                </div>
                <button
                  onClick={() => setCsatOrder(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                <div className="font-bold text-white">{csatOrder.customer_name}</div>
                <div className="text-slate-400 mt-0.5">
                  Order: <span className="font-mono text-blue-400">{csatOrder.delivery_note_no}</span>
                </div>
              </div>

              {/* 5-Star Rating Selector */}
              <div className="mt-5 text-center">
                <label className="block text-slate-300 font-semibold text-xs mb-2">
                  Customer Star Rating:
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1.5 rounded-lg hover:scale-110 transition"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400 drop-shadow-md'
                            : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-sm font-bold text-amber-300 mt-2">
                  {rating === 5 && '⭐⭐⭐⭐⭐ (5 - Outstanding & On-Time)'}
                  {rating === 4 && '⭐⭐⭐⭐ (4 - Very Good)'}
                  {rating === 3 && '⭐⭐⭐ (3 - Satisfactory)'}
                  {rating === 2 && '⭐⭐ (2 - Needs Attention)'}
                  {rating === 1 && '⭐ (1 - Dissatisfied)'}
                </div>
              </div>

              {/* Category Tags */}
              <div className="mt-4 text-xs">
                <label className="block text-slate-400 font-semibold mb-2">
                  Experience Highlights:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TAG_OPTIONS.map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback Comments */}
              <div className="mt-4 text-xs">
                <label className="block text-slate-400 font-semibold mb-1">
                  Customer Comments / Remarks:
                </label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  placeholder="e.g. Carpenter arrived on time, cleaned up packing boxes, checked locks..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              {rating <= 2 && (
                <div className="mt-3 p-2 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>
                    Ratings of 2 stars or lower are auto-escalated to the Store Manager for priority resolution.
                  </span>
                </div>
              )}

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCsatOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCsatSubmit}
                  disabled={submittingCsat}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg transition"
                >
                  <Star className="w-4 h-4 fill-white" />
                  {submittingCsat ? 'Saving...' : 'Submit CSAT'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
