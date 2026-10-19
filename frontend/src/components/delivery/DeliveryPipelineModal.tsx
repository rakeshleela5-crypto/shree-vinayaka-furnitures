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
  seedDeliveryPipelineSampleData,
  api
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
  { key: 'Booked', label: '1. BOOKED', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  { key: 'BoxVerified', label: '2. PACKED (KD Boxes)', icon: Boxes, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
  { key: 'OutForDelivery', label: '3. DISPATCHED', icon: Truck, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  { key: 'Delivered', label: '4. DELIVERED', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  { key: 'AssemblyInProgress', label: '5. INSTALLATION ASSIGNED', icon: Wrench, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  { key: 'Closed', label: '6. INSTALLED & CLOSED', icon: Star, color: 'text-amber-300', bg: 'bg-amber-500/20 border-amber-500/40' },
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
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  // Multi-Box Verification Gate (Frame 5)
  const [orderTotalBoxes, setOrderTotalBoxes] = useState<number>(4);
  const [verifiedBoxes, setVerifiedBoxes] = useState<number[]>([]);

  // E-Way Bill Prompt for Consignments >= ₹50,000
  const [ewayOrder, setEwayOrder] = useState<DeliveryPipelineItem | null>(null);
  const [promptEwayNo, setPromptEwayNo] = useState<string>('');
  const [promptVehicleNo, setPromptVehicleNo] = useState<string>('');
  const [ewayError, setEwayError] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);

  // Dedicated Carpenter Assignment Modal
  const [assigningCarpenterOrder, setAssigningCarpenterOrder] = useState<DeliveryPipelineItem | null>(null);
  const [carpenterName, setCarpenterName] = useState<string>('Manoharan (Senior Carpenter)');
  const [carpenterPhone, setCarpenterPhone] = useState<string>('9846203040');
  const [carpenterNotes, setCarpenterNotes] = useState<string>('Standard showroom warranty assembly');
  const [submittingCarpenter, setSubmittingCarpenter] = useState<boolean>(false);

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
    else if (order.stage === 'OutForDelivery') nextStage = 'Delivered';
    else if (order.stage === 'Delivered') nextStage = 'AssemblyInProgress';
    else if (order.stage === 'AssemblyInProgress') nextStage = 'Closed';

    let totalBoxes = 4;
    try {
      const parsedItems = JSON.parse(order.items_json || '[]');
      const calculated = parsedItems.reduce((acc: number, it: any) => acc + (it.total_boxes || it.totalBoxes || it.boxes || 0), 0);
      if (calculated > 0) totalBoxes = calculated;
    } catch {}
    setOrderTotalBoxes(totalBoxes);
    if (order.stage === 'BoxVerified' || order.stage === 'OutForDelivery' || order.stage === 'Delivered') {
      setVerifiedBoxes(Array.from({ length: totalBoxes }, (_, i) => i + 1));
    } else {
      setVerifiedBoxes([]);
    }

    setTargetStage(nextStage);
    setDriverName(order.driver_name || 'Biju Kumar');
    setDriverPhone(order.driver_phone || '9447102030');
    setVehicleNo(order.vehicle_no || 'KL-05-AR-4491');
    setEwayBillNo(order.eway_bill_no || '');
    setTechnicianName(order.technician_name || 'Manoharan (Senior Carpenter)');
    setTechnicianPhone(order.technician_phone || '9846203040');
    setAssemblyNotes(order.assembly_notes || '');
    setAdvanceError(null);
  };

  const handleAdvanceSubmit = async () => {
    if (!advancingOrder) return;

    // Frame 5 Rule: Multi-box dispatch verification gate
    if (targetStage === 'OutForDelivery') {
      if (verifiedBoxes.length < orderTotalBoxes) {
        setAdvanceError(`⚠️ Dispatch Blocked: You must verify and check all ${orderTotalBoxes} boxes before marking consignment as Dispatched! (${verifiedBoxes.length}/${orderTotalBoxes} verified)`);
        return;
      }
    }

    // Frame 5 Rule: Mandate valid 12-digit E-Way Bill & Vehicle if consignment >= ₹50,000 when dispatching
    if (advancingOrder.grand_total >= 50000 && (targetStage === 'OutForDelivery' || targetStage === 'Delivered')) {
      const cleanEway = ewayBillNo.trim().replace(/\D/g, '');
      if (!cleanEway || cleanEway.length !== 12) {
        setAdvanceError('⚠️ A valid 12-digit E-Way Bill Number is legally mandatory for consignments exceeding ₹50,000 (Rule 138 CGST).');
        return;
      }
      if (!vehicleNo.trim()) {
        setAdvanceError('⚠️ Transport Vehicle Registration Number is legally mandatory for E-Way Bill Part-B dispatch.');
        return;
      }
    }

    try {
      setSubmittingStage(true);
      setAdvanceError(null);
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
      setAdvanceError('Error advancing stage: ' + err.message);
    } finally {
      setSubmittingStage(false);
    }
  };

  const handleDownloadChallan = async (order: DeliveryPipelineItem) => {
    // Mandate E-Way Bill prompt if >= ₹50,000 and missing
    if (order.grand_total >= 50000 && (!order.eway_bill_no || !order.vehicle_no)) {
      setEwayOrder(order);
      setPromptEwayNo(order.eway_bill_no || '');
      setPromptVehicleNo(order.vehicle_no || '');
      setEwayError(null);
      return;
    }

    try {
      setGeneratingPdf(true);
      await api.downloadDeliveryNotePdf(order.id);
      showToast?.(`✓ Delivery Challan PDF for ${order.delivery_note_no} generated!`, 'success');
    } catch (err: any) {
      showToast?.('Error downloading Delivery Challan PDF: ' + err.message, 'error');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleSaveEwayAndDownload = async () => {
    if (!ewayOrder) return;
    if (!promptEwayNo.trim() || !promptVehicleNo.trim()) {
      setEwayError('⚠️ Both E-Way Bill Number and Transport Vehicle Number are legally mandatory for orders exceeding ₹50,000.');
      return;
    }

    try {
      setGeneratingPdf(true);
      setEwayError(null);
      await advanceDeliveryStage(ewayOrder.id, {
        stage: ewayOrder.stage,
        eway_bill_no: promptEwayNo.trim(),
        vehicle_no: promptVehicleNo.trim()
      });
      const orderId = ewayOrder.id;
      setEwayOrder(null);
      await loadOrders();
      await api.downloadDeliveryNotePdf(orderId);
      showToast?.(`✓ E-Way Bill saved & Delivery Challan downloaded!`, 'success');
    } catch (err: any) {
      setEwayError('Failed to record E-Way Bill: ' + err.message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleAssignCarpenterSubmit = async () => {
    if (!assigningCarpenterOrder) return;
    try {
      setSubmittingCarpenter(true);
      await advanceDeliveryStage(assigningCarpenterOrder.id, {
        stage: 'AssemblyInProgress',
        technician_name: carpenterName,
        technician_phone: carpenterPhone,
        assembly_notes: carpenterNotes
      });
      showToast?.(`✓ Carpenter ${carpenterName} assigned to ${assigningCarpenterOrder.delivery_note_no}!`, 'success');
      setAssigningCarpenterOrder(null);
      await loadOrders();
    } catch (err: any) {
      showToast?.('Failed to assign carpenter: ' + err.message, 'error');
    } finally {
      setSubmittingCarpenter(false);
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
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-300" />
            <input
              type="text"
              placeholder="Search customer, note #, or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </form>
        </div>

        {/* Pipeline Cards Grid */}
        <div className="flex-1 overflow-auto p-4">
          {loading && orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-200 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
              <p className="text-sm font-medium">Loading delivery orders and live stage matrix...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-300 gap-3">
              <Truck className="w-12 h-12 text-slate-400" />
              <p className="text-base font-semibold text-slate-100">No delivery orders in this stage</p>
              <p className="text-xs text-slate-300 font-medium max-w-md text-center">
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
                            <div className="text-[10px] text-slate-300 font-medium mt-1">
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
                    <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleWhatsAppCsat(order)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold transition cursor-pointer"
                          title="Send WhatsApp CSAT Rating Prompt to Customer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          WhatsApp
                        </button>
                        <button
                          onClick={() => handleDownloadChallan(order)}
                          disabled={generatingPdf}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold transition cursor-pointer"
                          title="Generate & Download Official Delivery Challan PDF"
                        >
                          <FileText className="w-3 h-3" />
                          Challan PDF
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {order.stage !== 'Closed' && (
                          <button
                            onClick={() => {
                              setAssigningCarpenterOrder(order);
                              setCarpenterName(order.technician_name || 'Manoharan (Senior Carpenter)');
                              setCarpenterPhone(order.technician_phone || '9846203040');
                              setCarpenterNotes(order.assembly_notes || '');
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-[11px] font-semibold transition cursor-pointer"
                            title="Assign Carpenter / Technician for Home Assembly"
                          >
                            <Wrench className="w-3 h-3" />
                            Carpenter
                          </button>
                        )}

                        {order.stage !== 'Closed' && (
                          <button
                            onClick={() => openCsatModal(order)}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-[11px] font-semibold transition cursor-pointer"
                            title="Record Customer 5-Star Rating & Feedback"
                          >
                            <Star className="w-3 h-3 fill-amber-400" />
                            CSAT
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setAdvanceError(null);
                            openAdvanceModal(order);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition shadow cursor-pointer"
                        >
                          <span>Advance</span>
                          <ChevronRight className="w-3 h-3" />
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

                {/* Multi-Box Warehouse Verification Checklist Strip */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-300">
                      📦 Multi-Box Warehouse Verification Checklist ({verifiedBoxes.length} of {orderTotalBoxes} Verified)
                    </span>
                    <button
                      type="button"
                      onClick={() => setVerifiedBoxes(verifiedBoxes.length === orderTotalBoxes ? [] : Array.from({ length: orderTotalBoxes }, (_, i) => i + 1))}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-bold underline"
                    >
                      {verifiedBoxes.length === orderTotalBoxes ? 'Uncheck All' : 'Verify All Boxes'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Array.from({ length: orderTotalBoxes }, (_, i) => i + 1).map(boxNum => {
                      const isChecked = verifiedBoxes.includes(boxNum);
                      const boxNames = [
                        'Main Cabinet Frame & Panels',
                        'Mirrored Doors & Soft-Close Hinges',
                        'Internal Shelves & Hanging Rods',
                        'Hardware Kit, Lockset & Master Keys'
                      ];
                      const label = boxNames[boxNum - 1] || `Component Sub-Box ${boxNum}`;
                      return (
                        <label
                          key={boxNum}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                            isChecked
                              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setVerifiedBoxes(prev => [...prev, boxNum]);
                              } else {
                                setVerifiedBoxes(prev => prev.filter(b => b !== boxNum));
                              }
                            }}
                            className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                          />
                          <span className="font-semibold text-[11px]">
                            Box {boxNum}/{orderTotalBoxes}: {label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {advanceError && (
                  <div className="mt-2 text-xs font-bold text-rose-400 bg-rose-950/60 p-2.5 rounded-xl border border-rose-800">
                    {advanceError}
                  </div>
                )}
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
                  id="mark-dispatched-submit-btn"
                  type="button"
                  onClick={handleAdvanceSubmit}
                  disabled={submittingStage}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg transition disabled:bg-slate-700 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submittingStage
                    ? 'Dispatching...'
                    : targetStage === 'OutForDelivery'
                    ? 'Mark Dispatched'
                    : 'Confirm Stage Update'}
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

        {/* Modal: Mandatory E-Way Bill Prompt for Consignments >= ₹50,000 */}
        {ewayOrder && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl p-6 text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-bold text-white text-base">Mandatory E-Way Bill Required</h3>
                </div>
                <button
                  onClick={() => setEwayOrder(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                Consignment Value: <strong className="text-white">₹{ewayOrder.grand_total.toLocaleString('en-IN')}</strong> exceeds the statutory ₹50,000 threshold. Under <strong>Rule 138 of CGST Rules</strong>, an E-Way Bill Number and Transport Vehicle Number are mandatory before generating the Delivery Challan PDF.
              </div>

              {ewayError && (
                <div className="mt-2 text-xs font-bold text-rose-400 bg-rose-950/60 p-2 rounded border border-rose-800">
                  {ewayError}
                </div>
              )}

              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    E-Way Bill Number (12 digits) *
                  </label>
                  <input
                    type="text"
                    required
                    value={promptEwayNo}
                    placeholder="e.g. 241188990123"
                    onChange={e => setPromptEwayNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Transport Vehicle Registration Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={promptVehicleNo}
                    placeholder="e.g. OD-02-BC-4891"
                    onChange={e => setPromptVehicleNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEwayOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={generatingPdf}
                  onClick={handleSaveEwayAndDownload}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg transition cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  {generatingPdf ? 'Saving & Generating...' : 'Save & Download Challan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Carpenter / Technician Assignment */}
        {assigningCarpenterOrder && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-slate-900 border border-purple-500/50 rounded-2xl shadow-2xl p-6 text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-purple-400">
                  <Wrench className="w-5 h-5" />
                  <h3 className="font-bold text-white text-base">Assign Showroom Carpenter</h3>
                </div>
                <button
                  onClick={() => setAssigningCarpenterOrder(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs">
                <div className="font-bold text-white">{assigningCarpenterOrder.customer_name}</div>
                <div className="text-slate-400">
                  Challan: <strong className="text-purple-300">{assigningCarpenterOrder.delivery_note_no}</strong> • Value: ₹{assigningCarpenterOrder.grand_total.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Carpenter / Technician Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={carpenterName}
                    onChange={e => setCarpenterName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Carpenter Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={carpenterPhone}
                    onChange={e => setCarpenterPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-medium focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Assembly Instructions / Tools Required:
                  </label>
                  <textarea
                    rows={2}
                    value={carpenterNotes}
                    onChange={e => setCarpenterNotes(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAssigningCarpenterOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingCarpenter}
                  onClick={handleAssignCarpenterSubmit}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submittingCarpenter ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
