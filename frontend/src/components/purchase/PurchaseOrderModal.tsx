import React, { useState, useEffect } from 'react';
import type { Product } from '../../types/retailDaddy';
import { api } from '../../api/client';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onStockUpdated?: (barcode: string, goodQty: number) => void;
  showToast: (msg: string) => void;
}

interface NewPoItem {
  productId: number;
  barcode: string;
  productName: string;
  orderedQty: number;
  unitPrice: number;
  totalBoxes: number;
}

interface GrnItemState {
  poItemId: number;
  productId: number;
  barcode: string;
  productName: string;
  orderedQty: number;
  receivedGood: number;
  receivedDamaged: number;
  totalBoxes: number;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  products,
  onStockUpdated,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE_PO' | 'RECORD_GRN'>('LIST');
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Create PO form state
  const [poSupplierName, setPoSupplierName] = useState<string>('Godrej & Boyce Mfg. Co. Ltd.');
  const [poSupplierGstin, setPoSupplierGstin] = useState<string>('21AAACG1123D1Z4');
  const [poExpectedDate, setPoExpectedDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [poRemarks, setPoRemarks] = useState<string>('Godrej Interio Showroom Stock Replenishment');
  const [poItems, setPoItems] = useState<NewPoItem[]>([]);
  const [selectedProdId, setSelectedProdId] = useState<string>(String(products[0]?.id || ''));
  const [itemQty, setItemQty] = useState<number>(5);
  const [itemPrice, setItemPrice] = useState<number>(products[0]?.purchasePrice || 15000);

  // GRN form state
  const [activePo, setActivePo] = useState<any | null>(null);
  const [grnChallanNo, setGrnChallanNo] = useState<string>('');
  const [grnVehicleNo, setGrnVehicleNo] = useState<string>('');
  const [grnRemarks, setGrnRemarks] = useState<string>('');
  const [grnItems, setGrnItems] = useState<GrnItemState[]>([]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPurchaseOrders();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (e) {
      console.warn('Failed to load purchase orders:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
      if (products.length > 0 && poItems.length === 0) {
        const p = products[0];
        setPoItems([
          {
            productId: Number(p.id) || 1,
            barcode: p.barcode || '8901101',
            productName: p.name,
            orderedQty: 5,
            unitPrice: p.purchasePrice || 15000,
            totalBoxes: p.total_boxes || 1
          }
        ]);
      }
    }
  }, [isOpen]);

  const resetCreatePoForm = () => {
    setPoSupplierName('Godrej & Boyce Mfg. Co. Ltd.');
    setPoSupplierGstin('21AAACG1123D1Z4');
    setPoRemarks('Godrej Interio Showroom Stock Replenishment');
    setValidationError(null);
    setIsSubmitting(false);
    setActiveTab('LIST');
  };

  const handleAddPoItem = () => {
    const prod = products.find(p => String(p.id) === selectedProdId);
    if (!prod) return;
    if (itemQty <= 0) {
      setValidationError('Please enter a valid quantity greater than zero');
      return;
    }
    setValidationError(null);
    setPoItems(prev => [
      ...prev,
      {
        productId: Number(prod.id) || 1,
        barcode: prod.barcode || '',
        productName: prod.name,
        orderedQty: itemQty,
        unitPrice: itemPrice || prod.purchasePrice || 0,
        totalBoxes: prod.total_boxes || 1
      }
    ]);
  };

  const handleRemovePoItem = (index: number) => {
    setPoItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (poItems.length === 0) {
      setValidationError('Please add at least one product item to the purchase order');
      return;
    }
    setIsSubmitting(true);
    setValidationError(null);

    try {
      const subTotal = poItems.reduce((acc, it) => acc + (it.orderedQty * it.unitPrice), 0);
      const taxAmount = Math.round(subTotal * 0.18 * 100) / 100;
      const grandTotal = Math.round((subTotal + taxAmount) * 100) / 100;
      const poNo = `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
      const dateStr = new Date().toISOString().split('T')[0];

      const payload = {
        po_no: poNo,
        date: dateStr,
        supplier_id: 1,
        supplier_name: poSupplierName,
        expected_delivery_date: poExpectedDate,
        status: 'PENDING',
        sub_total: subTotal,
        tax_amount: taxAmount,
        grand_total: grandTotal,
        remarks: poRemarks,
        items: poItems.map(it => ({
          product_id: it.productId,
          product_code: it.barcode,
          product_name: it.productName,
          barcode: it.barcode,
          hsn_code: '9403',
          ordered_qty: it.orderedQty,
          unit_price: it.unitPrice,
          tax_percent: 18.0,
          total_amount: Math.round(it.orderedQty * it.unitPrice * 1.18 * 100) / 100
        }))
      };

      const res = await api.createPurchaseOrder(payload);
      showToast(`✓ Purchase Order ${res.po_no || res.po_number || poNo} created successfully!`);
      resetCreatePoForm();
      fetchOrders();
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to create Purchase Order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenGrn = (po: any) => {
    setActivePo(po);
    setGrnChallanNo(`DC-${Date.now().toString().slice(-6)}`);
    setGrnVehicleNo('OD-02-BC-4891');
    setGrnRemarks('Goods received and inspected at warehouse');
    setValidationError(null);

    const items: GrnItemState[] = (po.items || []).map((it: any) => {
      const remaining = Math.max(0, it.ordered_qty - (it.received_good_qty || it.received_qty || 0));
      return {
        poItemId: it.id,
        productId: it.product_id,
        barcode: it.barcode || '',
        productName: it.product_name,
        orderedQty: it.ordered_qty,
        receivedGood: remaining,
        receivedDamaged: 0,
        totalBoxes: it.total_boxes || 1
      };
    });

    setGrnItems(items);
    setActiveTab('RECORD_GRN');
  };

  const handleRecordGrnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePo) return;
    setIsSubmitting(true);
    setValidationError(null);

    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const payload = {
        grn_no: grnChallanNo || `GRN-${Date.now().toString().slice(-6)}`,
        po_id: activePo.id,
        po_no: activePo.po_no || `PO-${activePo.id}`,
        date: dateStr,
        supplier_id: activePo.supplier_id || 1,
        supplier_name: activePo.supplier_name || 'Godrej & Boyce Mfg. Co. Ltd.',
        vendor_invoice_no: grnChallanNo,
        vehicle_no: grnVehicleNo,
        remarks: grnRemarks,
        items: grnItems.map(it => {
          const poIt = (activePo.items || []).find((p: any) => p.product_id === it.productId);
          const price = poIt?.unit_price || 15000;
          return {
            product_id: it.productId,
            product_code: it.barcode,
            product_name: it.productName,
            barcode: it.barcode,
            ordered_qty: it.orderedQty,
            received_good: it.receivedGood,
            received_damaged: it.receivedDamaged,
            pending_backorder: Math.max(0, it.orderedQty - (it.receivedGood + it.receivedDamaged)),
            unit_price: price,
            damage_claim_amount: it.receivedDamaged * price,
            carton_boxes_verified: true,
            scanned_box_barcodes_json: null
          };
        })
      };

      const res = await api.recordGoodsReceiptNote(activePo.id, payload);
      
      grnItems.forEach(it => {
        if (it.receivedGood > 0 && onStockUpdated) {
          onStockUpdated(it.barcode, it.receivedGood);
        }
      });

      const damageTotal = grnItems.reduce((acc, it) => acc + it.receivedDamaged, 0);
      if (damageTotal > 0) {
        showToast(`✓ GRN ${res.grn_no || res.grn_number || payload.grn_no} recorded! ⚠️ Debit note created for ${damageTotal} damaged units.`);
      } else {
        showToast(`✓ GRN ${res.grn_no || res.grn_number || payload.grn_no} recorded successfully! Warehouse physical stock updated.`);
      }

      setActiveTab('LIST');
      fetchOrders();
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to record Goods Receipt Note');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={e => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-lg shadow-2xl flex flex-col border-2 border-[#003366] overflow-hidden text-xs">
        {/* Header */}
        <div className="bg-[#003366] text-white px-4 py-2.5 flex items-center justify-between font-bold">
          <div className="flex items-center gap-2 text-sm">
            <span>🏭</span>
            <span>Godrej Interio Purchase Orders & Goods Receipt Note (GRN) Engine</span>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="w-5 h-5 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center rounded text-xs cursor-pointer disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-100 border-b border-gray-300 font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('LIST')}
            className={`px-4 py-2 uppercase tracking-wider border-r border-gray-300 transition-colors ${
              activeTab === 'LIST' ? 'bg-[#004080] text-white' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            📋 Purchase Orders List ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setValidationError(null);
              setActiveTab('CREATE_PO');
            }}
            className={`px-4 py-2 uppercase tracking-wider border-r border-gray-300 transition-colors ${
              activeTab === 'CREATE_PO' ? 'bg-[#004080] text-white' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            ➕ Create Supplier Purchase Order
          </button>
          {activeTab === 'RECORD_GRN' && (
            <button
              type="button"
              className="px-4 py-2 uppercase tracking-wider bg-amber-600 text-white font-bold"
            >
              📦 Record GRN for {activePo?.po_number}
            </button>
          )}
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="bg-red-100 text-red-700 px-4 py-1.5 font-bold border-b border-red-300 flex items-center justify-between">
            <span>⚠️ {validationError}</span>
            <button onClick={() => setValidationError(null)} className="text-red-600 hover:text-red-900">✕</button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          {/* TAB 1: LIST */}
          {activeTab === 'LIST' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-semibold">
                  Recent Purchase Orders to Godrej Interio & Allied Suppliers
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={fetchOrders}
                    disabled={isLoading}
                    className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded font-bold shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <span>🔄</span> Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('CREATE_PO')}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-bold shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <span>+</span> New PO
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-slate-500 font-semibold">
                  Loading Purchase Orders from Railway PostgreSQL database...
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded p-8 text-center text-slate-500">
                  <p className="text-sm font-semibold mb-2">No Purchase Orders on record yet.</p>
                  <p className="text-xs mb-4">Click "Create Supplier Purchase Order" to raise an official replenishment PO.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('CREATE_PO')}
                    className="px-4 py-1.5 bg-[#003366] text-white font-bold rounded shadow hover:brightness-110"
                  >
                    Create First Purchase Order
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#003366] text-white">
                      <tr>
                        <th className="py-1.5 px-3">PO Number</th>
                        <th className="py-1.5 px-3">Date</th>
                        <th className="py-1.5 px-3">Supplier Name</th>
                        <th className="py-1.5 px-3 text-right">Items / Qty</th>
                        <th className="py-1.5 px-3 text-right">Total (₹)</th>
                        <th className="py-1.5 px-3 text-center">Status</th>
                        <th className="py-1.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orders.map((po, idx) => {
                        const totalOrdered = (po.items || []).reduce((acc: number, it: any) => acc + (it.ordered_qty || 0), 0);
                        const totalRec = (po.items || []).reduce((acc: number, it: any) => acc + (it.received_qty || 0), 0);
                        return (
                          <tr key={po.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="py-2 px-3 font-mono font-bold text-blue-900">{po.po_number}</td>
                            <td className="py-2 px-3 text-slate-600">{po.order_date}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{po.supplier_name}</td>
                            <td className="py-2 px-3 text-right text-slate-700">
                              {totalRec} / {totalOrdered} pcs
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              ₹{(po.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  po.status === 'COMPLETED'
                                    ? 'bg-green-100 text-green-800 border border-green-300'
                                    : po.status === 'PARTIALLY_RECEIVED'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                                }`}
                              >
                                {po.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">
                              {po.status !== 'COMPLETED' ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenGrn(po)}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded shadow-xs text-xs cursor-pointer"
                                >
                                  📦 Record GRN
                                </button>
                              ) : (
                                <span className="text-green-600 font-bold text-xs">✓ Inward Complete</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATE PO */}
          {activeTab === 'CREATE_PO' && (
            <form onSubmit={handleCreatePoSubmit} className="space-y-4">
              <div className="bg-white p-3 rounded border border-slate-300 shadow-xs grid grid-cols-12 gap-3">
                <div className="col-span-5">
                  <label className="block text-slate-700 font-bold mb-1">Supplier / Factory Name *</label>
                  <input
                    type="text"
                    value={poSupplierName}
                    onChange={e => setPoSupplierName(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-semibold text-slate-900 focus:outline-blue-500"
                  />
                </div>
                <div className="col-span-4">
                  <label className="block text-slate-700 font-bold mb-1">Supplier GSTIN</label>
                  <input
                    type="text"
                    value={poSupplierGstin}
                    onChange={e => setPoSupplierGstin(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-900 focus:outline-blue-500"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-slate-700 font-bold mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={poExpectedDate}
                    onChange={e => setPoExpectedDate(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-blue-500"
                  />
                </div>
              </div>

              {/* Add Item Builder */}
              <div className="bg-blue-50 border border-blue-200 p-3 rounded shadow-xs">
                <div className="font-bold text-[#003366] mb-2 flex items-center justify-between">
                  <span>Add Furniture Line Items to Purchase Order</span>
                  <span className="text-[11px] text-slate-600 font-normal">
                    Supports Godrej Knock-Down (KD) Carton Tracking
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <label className="block font-semibold text-slate-700 mb-0.5">Select Product SKU</label>
                    <select
                      value={selectedProdId}
                      onChange={e => {
                        setSelectedProdId(e.target.value);
                        const p = products.find(prod => String(prod.id) === e.target.value);
                        if (p) setItemPrice(p.purchasePrice || 15000);
                      }}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-medium text-slate-900"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.barcode || p.pCode}) - KD Boxes: {p.total_boxes || 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block font-semibold text-slate-700 mb-0.5">Order Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={e => setItemQty(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-bold text-center text-slate-900"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block font-semibold text-slate-700 mb-0.5">Unit Purchase Rate (₹)</label>
                    <input
                      type="number"
                      step="any"
                      value={itemPrice}
                      onChange={e => setItemPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-bold text-right text-slate-900"
                    />
                  </div>
                  <div className="col-span-2">
                    <button
                      type="button"
                      onClick={handleAddPoItem}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 rounded shadow cursor-pointer text-xs"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#004080] text-white">
                    <tr>
                      <th className="py-1 px-3">Product Description</th>
                      <th className="py-1 px-3">Barcode</th>
                      <th className="py-1 px-3 text-center">KD Boxes / Unit</th>
                      <th className="py-1 px-3 text-right">Ordered Qty</th>
                      <th className="py-1 px-3 text-right">Unit Rate (₹)</th>
                      <th className="py-1 px-3 text-right">Line Total (₹)</th>
                      <th className="py-1 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {poItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-slate-400">
                          No items added yet. Select a product above and click "+ Add Item".
                        </td>
                      </tr>
                    ) : (
                      poItems.map((it, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="py-1.5 px-3 font-semibold text-slate-800">{it.productName}</td>
                          <td className="py-1.5 px-3 font-mono text-slate-600">{it.barcode}</td>
                          <td className="py-1.5 px-3 text-center">
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                              {it.totalBoxes} Box{it.totalBoxes > 1 ? 'es' : ''}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-right font-bold text-slate-900">{it.orderedQty}</td>
                          <td className="py-1.5 px-3 text-right font-mono text-slate-700">₹{it.unitPrice.toFixed(2)}</td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold text-blue-900">
                            ₹{(it.orderedQty * it.unitPrice).toFixed(2)}
                          </td>
                          <td className="py-1.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePoItem(idx)}
                              className="text-red-500 hover:text-red-700 font-bold cursor-pointer"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {poItems.length > 0 && (
                    <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                      <tr>
                        <td colSpan={5} className="py-2 px-3 text-right text-slate-700">
                          Total PO Consignment Value:
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-sm text-green-700">
                          ₹
                          {poItems
                            .reduce((acc, it) => acc + it.orderedQty * it.unitPrice, 0)
                            .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Remarks / Terms of Purchase</label>
                <textarea
                  rows={2}
                  value={poRemarks}
                  onChange={e => setPoRemarks(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-slate-900 focus:outline-blue-500"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setActiveTab('LIST')}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || poItems.length === 0}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Submitting Purchase Order...' : '✓ Issue Purchase Order to Supplier'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: RECORD GRN */}
          {activeTab === 'RECORD_GRN' && activePo && (
            <form onSubmit={handleRecordGrnSubmit} className="space-y-4">
              <div className="bg-amber-50 border border-amber-300 rounded p-3 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-amber-900 text-sm">
                    Inward Goods Receipt Note against PO: {activePo.po_number}
                  </div>
                  <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
                    Supplier: {activePo.supplier_name}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-4">
                    <label className="block text-xs font-bold text-amber-900 mb-0.5">
                      Delivery Challan / Invoice No *
                    </label>
                    <input
                      type="text"
                      required
                      value={grnChallanNo}
                      onChange={e => setGrnChallanNo(e.target.value)}
                      className="w-full bg-white border border-amber-400 rounded px-2 py-1 font-semibold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="block text-xs font-bold text-amber-900 mb-0.5">
                      Delivery Vehicle / Container No
                    </label>
                    <input
                      type="text"
                      value={grnVehicleNo}
                      onChange={e => setGrnVehicleNo(e.target.value)}
                      className="w-full bg-white border border-amber-400 rounded px-2 py-1 font-mono text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="block text-xs font-bold text-amber-900 mb-0.5">Remarks / Seal Status</label>
                    <input
                      type="text"
                      value={grnRemarks}
                      onChange={e => setGrnRemarks(e.target.value)}
                      className="w-full bg-white border border-amber-400 rounded px-2 py-1 text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* GRN Line Items with Partial & Damaged Tracking */}
              <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#003366] text-white">
                    <tr>
                      <th className="py-2 px-3">Product SKU</th>
                      <th className="py-2 px-3 text-center">KD Cartons</th>
                      <th className="py-2 px-3 text-right">Ordered</th>
                      <th className="py-2 px-3 text-right text-green-300">Received Good *</th>
                      <th className="py-2 px-3 text-right text-red-300">Received Damaged</th>
                      <th className="py-2 px-3 text-right">Pending Backorder</th>
                      <th className="py-2 px-3">Carton Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {grnItems.map((it, idx) => {
                      const backorder = Math.max(0, it.orderedQty - (it.receivedGood + it.receivedDamaged));
                      return (
                        <tr key={it.poItemId} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="py-2 px-3">
                            <div className="font-bold text-slate-800">{it.productName}</div>
                            <div className="font-mono text-[10px] text-slate-500">{it.barcode}</div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-bold border border-blue-200">
                              {it.totalBoxes} Box{it.totalBoxes > 1 ? 'es' : ''}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-700">{it.orderedQty}</td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              min="0"
                              max={it.orderedQty}
                              value={it.receivedGood}
                              onChange={e => {
                                const val = parseInt(e.target.value, 10) || 0;
                                setGrnItems(prev =>
                                  prev.map(item => (item.poItemId === it.poItemId ? { ...item, receivedGood: val } : item))
                                );
                              }}
                              className="w-16 bg-green-50 border border-green-500 rounded px-1.5 py-1 font-bold text-right text-green-900 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              min="0"
                              max={it.orderedQty}
                              value={it.receivedDamaged}
                              onChange={e => {
                                const val = parseInt(e.target.value, 10) || 0;
                                setGrnItems(prev =>
                                  prev.map(item => (item.poItemId === it.poItemId ? { ...item, receivedDamaged: val } : item))
                                );
                              }}
                              className="w-16 bg-red-50 border border-red-500 rounded px-1.5 py-1 font-bold text-right text-red-900 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-600">
                            {backorder > 0 ? (
                              <span className="text-amber-700 font-bold">{backorder} pending</span>
                            ) : (
                              <span className="text-green-700 font-bold">0</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-[11px]">
                            {it.totalBoxes > 1 ? (
                              <div className="flex flex-wrap gap-1">
                                {Array.from({ length: it.totalBoxes }).map((_, boxIdx) => (
                                  <span
                                    key={boxIdx}
                                    className="bg-slate-100 border border-slate-300 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono"
                                  >
                                    BOX-{boxIdx + 1}/{it.totalBoxes}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-500">Single Box</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Automatic Damaged Stock & Debit Note Note */}
              <div className="bg-blue-50 border border-blue-200 rounded p-2.5 flex items-start gap-2 text-xs text-blue-900">
                <span className="text-base">ℹ️</span>
                <div>
                  <strong>Stock Hedging Rule:</strong> Only <em>Received Good</em> units will be added to warehouse <strong>physical_stock</strong> and become available to sell. Any <em>Received Damaged</em> units will be routed into <strong>damaged_stock</strong> and will automatically generate a Vendor Debit Note against Godrej Interio for transit damage recovery.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setActiveTab('LIST')}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded cursor-pointer"
                >
                  Back to PO List
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Confirming GRN...' : '✓ Confirm Goods Receipt Note (GRN)'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
