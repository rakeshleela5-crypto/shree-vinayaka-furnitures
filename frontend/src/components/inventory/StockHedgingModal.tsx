import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  AlertTriangle,
  Truck,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Download,
  Boxes,
  ShieldAlert,
  Zap,
  Save
} from 'lucide-react';
import {
  fetchStockHedgingSummary,
  updateProductStockHedging,
  seedStockHedgingSampleData
} from '../../api/client';
import type { StockHedgingItem, StockHedgingSummary } from '../../types/retailDaddy';

interface StockHedgingModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const StockHedgingModal: React.FC<StockHedgingModalProps> = ({
  isOpen,
  onClose,
  showToast
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<StockHedgingSummary | null>(null);
  const [search, setSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'low_stock' | 'reserved' | 'transit'>('all');
  
  // Quick Edit Drawer State
  const [editingItem, setEditingItem] = useState<StockHedgingItem | null>(null);
  const [editReserved, setEditReserved] = useState<number>(0);
  const [editTransit, setEditTransit] = useState<number>(0);
  const [editMinStock, setEditMinStock] = useState<number>(5);
  const [editReorderQty, setEditReorderQty] = useState<number>(5);
  const [editLeadTime, setEditLeadTime] = useState<number>(7);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchStockHedgingSummary(search, activeTab !== 'all' ? activeTab : undefined);
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to load stock hedging summary:', err);
      showToast?.('Failed to load stock hedging analytics: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleSeedSample = async () => {
    try {
      setLoading(true);
      await seedStockHedgingSampleData();
      showToast?.('✓ Realistic Godrej stock hedging & in-transit numbers seeded successfully!', 'success');
      await loadData();
    } catch (err: any) {
      showToast?.('Failed to seed demo data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openEditDrawer = (item: StockHedgingItem) => {
    setEditingItem(item);
    setEditReserved(item.reserved_stock);
    setEditTransit(item.transit_stock);
    setEditMinStock(item.min_stock);
    setEditReorderQty(item.reorder_quantity);
    setEditLeadTime(item.lead_time_days);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      setSavingEdit(true);
      await updateProductStockHedging(editingItem.id, {
        reserved_stock: editReserved,
        transit_stock: editTransit,
        min_stock: editMinStock,
        reorder_quantity: editReorderQty,
        lead_time_days: editLeadTime
      });
      showToast?.(`✓ Updated stock hedging for ${editingItem.name}!`, 'success');
      setEditingItem(null);
      await loadData();
    } catch (err: any) {
      showToast?.('Error updating stock parameters: ' + err.message, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const exportIndentCsv = () => {
    if (!summary || summary.items.length === 0) {
      showToast?.('No stock items to export', 'warning');
      return;
    }
    const headers = [
      'SKU Code',
      'Product Name',
      'Barcode',
      'Category',
      'Physical In-Hand',
      'Reserved Orders',
      'Available to Promise (ATP)',
      'In-Transit (Factory)',
      'Virtual Total',
      'Min Stock Level',
      'Suggested Reorder Qty',
      'Stock Status'
    ];
    const rows = summary.items.map(i => [
      `"${i.p_code}"`,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.barcode}"`,
      `"${i.category_name || ''}"`,
      i.physical_stock,
      i.reserved_stock,
      i.available_stock,
      i.transit_stock,
      i.virtual_stock,
      i.min_stock,
      i.suggested_reorder_qty,
      i.stock_status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Godrej_Stock_Hedging_Indent_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('✓ Godrej Reorder Indent exported as CSV!', 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-7xl h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  Godrej Stock Hedging & Intelligent Reorder Engine
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live ATP & In-Transit Tracking
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Physical Showroom Stock ➔ Advance Customer Reservations ➔ Available To Promise (ATP) ➔ Factory Pipeline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSeedSample}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-200 text-xs font-medium transition"
              title="Seed realistic Godrej showroom stock, bookings and depot in-transit items"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Seed Godrej Demo Data
            </button>
            <button
              onClick={exportIndentCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export Indent CSV
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Refresh Analytics"
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

        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-slate-950/50 border-b border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Showroom Stock</span>
              <Package className="w-4 h-4 text-slate-300" />
            </div>
            <div className="text-xl font-extrabold text-white">
              {summary?.total_physical_stock ?? 0} <span className="text-xs font-normal text-slate-400">units</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Physical In-Hand in Godown</p>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40">
            <div className="flex items-center justify-between text-amber-300 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Reserved Orders</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-extrabold text-amber-200">
              {summary?.total_reserved_stock ?? 0} <span className="text-xs font-semibold text-amber-200">units</span>
            </div>
            <p className="text-[10px] text-amber-200 font-medium mt-0.5">Booked for customer dispatch</p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
            <div className="flex items-center justify-between text-emerald-300 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Available to Promise (ATP)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-extrabold text-emerald-300">
              {summary?.total_available_stock ?? 0} <span className="text-xs font-semibold text-emerald-200">units</span>
            </div>
            <p className="text-[10px] text-emerald-200 font-medium mt-0.5">Safe to sell to walk-ins</p>
          </div>

          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40">
            <div className="flex items-center justify-between text-indigo-300 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Godrej In-Transit</span>
              <Truck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl font-extrabold text-indigo-200">
              {summary?.total_transit_stock ?? 0} <span className="text-xs font-semibold text-indigo-200">units</span>
            </div>
            <p className="text-[10px] text-indigo-200 font-medium mt-0.5">En route from factory/depot</p>
          </div>

          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40">
            <div className="flex items-center justify-between text-rose-300 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Reorder Alerts</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl font-extrabold text-rose-300">
              {summary?.low_stock_count ?? 0} <span className="text-xs font-semibold text-rose-200">items</span>
            </div>
            <p className="text-[10px] text-rose-200 font-medium mt-0.5">
              {summary?.critical_stock_count ?? 0} at critical/stockout level
            </p>
          </div>
        </div>

        {/* Filter Bar & Tabs */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              All Models ({summary?.total_products_count ?? 0})
            </button>
            <button
              onClick={() => setActiveTab('low_stock')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'low_stock'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-400 hover:bg-rose-950/40'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Reorder Triggers ({summary?.low_stock_count ?? 0})
            </button>
            <button
              onClick={() => setActiveTab('reserved')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'reserved'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-400 hover:bg-amber-950/40'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Reserved Stock
            </button>
            <button
              onClick={() => setActiveTab('transit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'transit'
                  ? 'bg-indigo-700 text-white shadow-sm'
                  : 'text-indigo-400 hover:bg-indigo-950/40'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              In-Transit
            </button>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search product name, SKU, or barcode..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </form>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading && !summary ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-sm">Calculating Stock Hedging & In-Transit Matrix...</p>
            </div>
          ) : !summary || summary.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
              <Boxes className="w-12 h-12 text-slate-600" />
              <p className="text-base font-semibold text-slate-300">No stock hedging records found</p>
              <p className="text-xs text-slate-500 max-w-md text-center">
                Try clicking "Seed Godrej Demo Data" above to instantly populate realistic showroom inventory with reserved bookings and in-transit shipments.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-700 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-200 font-bold uppercase tracking-wider text-[11px] border-b border-slate-700">
                    <th className="p-3">Product / Godrej Model</th>
                    <th className="p-3 text-center">Physical</th>
                    <th className="p-3 text-center">Reserved</th>
                    <th className="p-3 text-center">Available (ATP)</th>
                    <th className="p-3 text-center">In-Transit</th>
                    <th className="p-3 text-center">Virtual Total</th>
                    <th className="p-3 text-center">Safety / Lead</th>
                    <th className="p-3 text-center">Suggested PO</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {summary.items.map(item => (
                    <tr
                        key={item.id}
                        className={`hover:bg-slate-800/40 transition ${
                          item.stock_status === 'Critical' || item.stock_status === 'Stockout'
                            ? 'bg-rose-950/20'
                            : ''
                        }`}
                      >
                        {/* Product Details */}
                        <td className="p-3 max-w-xs">
                          <div className="font-bold text-white text-sm truncate" title={item.name}>
                            {item.name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-300">
                            <span className="font-mono text-indigo-300 font-bold">{item.p_code}</span>
                            <span>•</span>
                            <span className="text-slate-200">{item.category_name}</span>
                            {item.is_knockdown && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] border border-amber-500/40 font-bold">
                                {item.total_boxes_count} Boxes
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Physical Stock */}
                        <td className="p-3 text-center">
                          <span className="font-bold text-white text-sm">{item.physical_stock}</span>
                          <div className="text-[10px] text-slate-300 font-medium">In Showroom</div>
                        </td>

                        {/* Reserved Stock */}
                        <td className="p-3 text-center">
                          <span className={`font-bold text-sm ${item.reserved_stock > 0 ? 'text-amber-300' : 'text-slate-400'}`}>
                            {item.reserved_stock}
                          </span>
                          <div className="text-[10px] text-amber-300 font-medium">Booked</div>
                        </td>

                        {/* Available To Promise (ATP) */}
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg font-extrabold text-sm ${
                              item.available_stock <= 0
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : item.available_stock <= item.min_stock
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {item.available_stock}
                          </span>
                          <div className="text-[10px] text-slate-300 font-medium mt-0.5">ATP Units</div>
                        </td>

                        {/* In-Transit Stock */}
                        <td className="p-3 text-center">
                          <span className={`font-bold text-sm ${item.transit_stock > 0 ? 'text-indigo-300' : 'text-slate-400'}`}>
                            +{item.transit_stock}
                          </span>
                          <div className="text-[10px] text-indigo-300 font-medium">Factory Transit</div>
                        </td>

                        {/* Virtual Stock Total */}
                        <td className="p-3 text-center">
                          <span className="font-extrabold text-white text-sm">{item.virtual_stock}</span>
                          <div className="text-[10px] text-slate-300 font-medium">ATP + Transit</div>
                        </td>

                        {/* Min Stock & Lead Time */}
                        <td className="p-3 text-center">
                          <div className="text-slate-200">Min: <strong className="text-white">{item.min_stock}</strong></div>
                          <div className="text-[10px] text-slate-300 font-medium">{item.lead_time_days} days lead</div>
                        </td>

                        {/* Suggested Reorder Qty */}
                        <td className="p-3 text-center">
                          {item.suggested_reorder_qty > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                              <AlertTriangle className="w-3 h-3" />
                              Order +{item.suggested_reorder_qty}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] font-bold">—</span>
                          )}
                        </td>

                        {/* Stock Status Badge */}
                        <td className="p-3 text-center">
                          {item.stock_status === 'Stockout' && (
                            <span className="px-2 py-1 rounded-full bg-rose-900/60 text-rose-200 border border-rose-700 text-[10px] font-bold">
                              STOCKOUT
                            </span>
                          )}
                          {item.stock_status === 'Critical' && (
                            <span className="px-2 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-bold">
                              CRITICAL
                            </span>
                          )}
                          {item.stock_status === 'LowStock' && (
                            <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                              LOW STOCK
                            </span>
                          )}
                          {item.stock_status === 'Adequate' && (
                            <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                              ADEQUATE
                            </span>
                          )}
                        </td>

                        {/* Quick Adjust Button */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => openEditDrawer(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
                            title="Adjust Reserved, Transit or Safety Levels"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                            Adjust
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Edit Drawer / Modal Backdrop */}
        {editingItem && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-white text-base">Adjust Stock Hedging Parameters</h3>
                </div>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="font-bold text-white text-sm">{editingItem.name}</div>
                <div className="text-xs text-slate-400 mt-1">
                  SKU: <span className="font-mono text-indigo-400">{editingItem.p_code}</span> • Physical In-Hand: <strong className="text-emerald-400">{editingItem.physical_stock} units</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    🔒 Reserved for Customer Orders:
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editReserved}
                    onChange={e => setEditReserved(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-amber-400/80 mt-1">Deducted from Available to Promise</p>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    🚚 In-Transit from Factory / Depot:
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editTransit}
                    onChange={e => setEditTransit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-indigo-400/80 mt-1">Dispatched but not yet inwarded</p>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    ⚠️ Min Safety Threshold (Reorder Point):
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editMinStock}
                    onChange={e => setEditMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    📦 Recommended Reorder Batch Qty:
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editReorderQty}
                    onChange={e => setEditReorderQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">
                    ⏱️ Factory Lead Time (Days):
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editLeadTime}
                    onChange={e => setEditLeadTime(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Standard Godrej factory dispatch lead time to Kottayam showroom</p>
                </div>
              </div>

              {/* Calculated ATP preview */}
              <div className="mt-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Projected Available to Promise (ATP):</span>
                  <div className="text-base font-extrabold text-emerald-400">
                    {Math.max(0, editingItem.physical_stock - editReserved)} units
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Projected Virtual Total:</span>
                  <div className="text-base font-extrabold text-indigo-300">
                    {Math.max(0, editingItem.physical_stock - editReserved) + editTransit} units
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition"
                >
                  <Save className="w-4 h-4" />
                  {savingEdit ? 'Saving...' : 'Save Parameters'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
