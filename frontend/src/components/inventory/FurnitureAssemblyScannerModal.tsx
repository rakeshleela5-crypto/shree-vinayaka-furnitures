import React, { useState, useEffect, useRef } from 'react';
import type { Product, ProductBoxComponent } from '../../types/retailDaddy';
import { verifyAssemblyBoxes, getProductBoxLabelsPdfUrl, fetchProductBoxComponents, downloadProductBoxLabelsPdf } from '../../api/client';
import { CheckCircle2, AlertTriangle, Package, Printer, ScanLine, X, Hammer, ShieldCheck } from 'lucide-react';

interface FurnitureAssemblyScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialProduct?: Product;
}

export const FurnitureAssemblyScannerModal: React.FC<FurnitureAssemblyScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  initialProduct
}) => {
  if (!isOpen) return null;

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct?.id || products[0]?.id || ''
  );
  const activeProduct = products.find(p => p.id === selectedProductId) || initialProduct || products[0];

  const [boxComponents, setBoxComponents] = useState<ProductBoxComponent[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [scannedBarcodes, setScannedBarcodes] = useState<string[]>([]);
  const [currentScanInput, setCurrentScanInput] = useState('');
  const [carpenterName, setCarpenterName] = useState('Senior Carpenter');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    isComplete: boolean;
    status: string;
    message: string;
  } | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Beep sound feedback using Web Audio API
  const playBeep = (success: boolean) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (success) {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else {
        osc.frequency.setValueAtTime(320, ctx.currentTime); // Low buzz
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {
      // AudioContext not allowed or supported
    }
  };

  // Load box components from backend or default fallback
  useEffect(() => {
    if (!activeProduct) return;
    setLoadingComponents(true);
    setScannedBarcodes([]);
    setVerificationResult(null);

    fetchProductBoxComponents(activeProduct.id)
      .then(comps => {
        if (comps && comps.length > 0) {
          setBoxComponents(comps);
        } else {
          // Generate default knockdown components if none exist
          const totalBoxes = activeProduct.totalBoxesCount || 3;
          const defaultNames = [
            'Headboard & Footboard Frame',
            'Side Rails & Central Stiffener',
            'Storage Box Unit & Hydraulic Lifters',
            'Hardware & Fitting Accessories'
          ];
          const mockComps: ProductBoxComponent[] = Array.from({ length: totalBoxes }, (_, i) => ({
            boxNumber: i + 1,
            totalBoxes: totalBoxes,
            componentName: defaultNames[i] || `Flat-Pack Component Box ${i + 1}`,
            boxBarcode: `${activeProduct.pCode}-BX${i + 1}`,
            boxSku: `${activeProduct.pCode}-BX${i + 1}`,
            dimensions: '200x120x15 cm',
            weightKg: 25,
            status: 'InStock'
          }));
          setBoxComponents(mockComps);
        }
      })
      .catch(() => {
        setBoxComponents([]);
      })
      .finally(() => {
        setLoadingComponents(false);
        setTimeout(() => barcodeInputRef.current?.focus(), 150);
      });
  }, [activeProduct?.id]);

  // Handle scanned barcode input
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = currentScanInput.trim().toUpperCase();
    if (!code) return;

    // Check if code matches any box in current product
    const matched = boxComponents.some(
      b => (b.boxBarcode && b.boxBarcode.toUpperCase() === code) ||
           (b.boxSku && b.boxSku.toUpperCase() === code) ||
           code.includes(`BX${b.boxNumber}`)
    );

    if (matched || boxComponents.length === 0) {
      if (!scannedBarcodes.includes(code)) {
        const next = [...scannedBarcodes, code];
        setScannedBarcodes(next);
        playBeep(true);
        // Check if all verified
        const allScanned = boxComponents.every(b =>
          next.some(sc =>
            sc === b.boxBarcode.toUpperCase() ||
            (b.boxSku && sc === b.boxSku.toUpperCase()) ||
            sc.includes(`BX${b.boxNumber}`)
          )
        );
        if (allScanned) {
          setVerificationResult({
            isComplete: true,
            status: 'Verified',
            message: `🎉 All ${boxComponents.length} boxes verified! Complete kit ready for carpenter assembly and dispatch.`
          });
        }
      } else {
        playBeep(true);
      }
    } else {
      playBeep(false);
      setVerificationResult({
        isComplete: false,
        status: 'Mismatch',
        message: `⚠️ Scanned Barcode "${code}" does not belong to any box of this product (${activeProduct.name}).`
      });
    }

    setCurrentScanInput('');
  };

  // Perform backend verification
  const handleVerifyComplete = async () => {
    if (!activeProduct) return;
    try {
      const res = await verifyAssemblyBoxes({
        productId: Number(activeProduct.id) || 1,
        scannedBarcodes: scannedBarcodes,
        invoiceNo: invoiceNo || undefined,
        carpenterName: carpenterName || undefined
      });
      setVerificationResult({
        isComplete: res.isComplete,
        status: res.status,
        message: res.message
      });
      playBeep(res.isComplete);
    } catch (err: any) {
      setVerificationResult({
        isComplete: false,
        status: 'Error',
        message: err.message || 'Error verifying boxes'
      });
    }
  };

  const isBoxScanned = (comp: ProductBoxComponent) => {
    return scannedBarcodes.some(
      sc => sc === (comp.boxBarcode || '').toUpperCase() ||
            (comp.boxSku && sc === comp.boxSku.toUpperCase()) ||
            sc.includes(`BX${comp.boxNumber}`)
    );
  };

  const scannedCount = boxComponents.filter(isBoxScanned).length;
  const isAllVerified = boxComponents.length > 0 && scannedCount === boxComponents.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
              <Hammer className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Godrej Flat-Pack Assembly & Dispatch Scanner
                <span className="text-xs bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  BOM Box Verifier
                </span>
              </h2>
              <p className="text-xs text-emerald-200">
                Scan each knockdown carton barcode to verify 100% complete furniture kits before delivery or assembly.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Controls Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Furniture Product:</label>
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.pCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Carpenter / Technician:</label>
            <input
              type="text"
              value={carpenterName}
              onChange={e => setCarpenterName(e.target.value)}
              placeholder="e.g. Ramesh Carpenter"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Invoice / Delivery Challan No:</label>
            <input
              type="text"
              value={invoiceNo}
              onChange={e => setInvoiceNo(e.target.value)}
              placeholder="e.g. SVF-2025-089"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Active Product Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">Selected Master Product</div>
              <div className="text-base font-bold text-slate-900">{activeProduct?.name}</div>
              <div className="text-xs text-slate-600 flex flex-wrap gap-3 mt-1">
                <span>SKU: <b className="text-slate-800">{activeProduct?.pCode}</b></span>
                <span>Category: <b>{activeProduct?.category}</b></span>
                <span>Total Boxes: <b>{boxComponents.length} Cartons</b></span>
                <span>MRP: <b>₹{(activeProduct?.mrp || 0).toLocaleString()}</b></span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await downloadProductBoxLabelsPdf(activeProduct?.pCode || activeProduct?.id || '1');
                  } catch (err: any) {
                    window.open(getProductBoxLabelsPdfUrl(activeProduct?.pCode || activeProduct?.id || '1'), '_blank');
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Multi-Box Stickers (PDF)
              </button>
            </div>
          </div>

          {/* Barcode Scanner Input */}
          <form onSubmit={handleBarcodeSubmit} className="bg-white border-2 border-dashed border-emerald-300 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <ScanLine className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Laser Scanner Gun / Barcode Reader (Auto-focus active):
                </label>
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={currentScanInput}
                  onChange={e => setCurrentScanInput(e.target.value)}
                  placeholder={`Scan box barcode (e.g. ${activeProduct?.pCode}-BX1) or type and hit Enter...`}
                  className="w-full text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <button
                type="submit"
                className="mt-5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow transition"
              >
                Record Scan
              </button>
            </div>
            <p className="text-[11px] text-slate-700 font-medium mt-2">
              Tip: Aim your wireless laser barcode gun at the carton label. Each box turns green as soon as it is scanned.
            </p>
          </form>

          {/* Verification Status Banner */}
          {verificationResult && (
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${
              verificationResult.isComplete
                ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                : 'bg-amber-100 border-amber-300 text-amber-900'
            }`}>
              {verificationResult.isComplete ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-700 shrink-0" />
              )}
              <div className="text-xs font-semibold">{verificationResult.message}</div>
            </div>
          )}

          {/* Knockdown Cartons Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-700" />
                Required Flat-Pack Cartons ({scannedCount} of {boxComponents.length} Verified)
              </h3>
              <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {isAllVerified ? (
                  <span className="text-emerald-700 font-bold">100% Complete</span>
                ) : (
                  <span className="text-amber-700 font-bold">{boxComponents.length - scannedCount} Cartons Pending</span>
                )}
              </div>
            </div>

            {loadingComponents ? (
              <div className="p-8 text-center text-slate-700 font-medium text-xs">Loading box components...</div>
            ) : boxComponents.length === 0 ? (
              <div className="p-8 text-center text-slate-700 font-medium text-xs bg-slate-50 rounded-xl border border-slate-200">
                No breakdown components found for this product. You can set them up in the Product Catalog.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {boxComponents.map(comp => {
                  const scanned = isBoxScanned(comp);
                  return (
                    <div
                      key={comp.boxNumber}
                      className={`relative rounded-xl border-2 p-4 transition-all ${
                        scanned
                          ? 'bg-emerald-50/80 border-emerald-500 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                            scanned ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            BOX {comp.boxNumber} OF {comp.totalBoxes}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {comp.componentName}
                          </span>
                        </div>

                        {scanned ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">
                            PENDING SCAN
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-slate-700 block text-[10px] font-bold uppercase">Box Barcode</span>
                          <span className="font-mono font-bold text-slate-800">{comp.boxBarcode}</span>
                        </div>
                        <div>
                          <span className="text-slate-700 block text-[10px] font-bold uppercase">Dimensions</span>
                          <span className="font-medium text-slate-700">{comp.dimensions || 'Standard Flat-Pack'}</span>
                        </div>
                      </div>

                      {/* Manual Quick Verify Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          if (scanned) {
                            setScannedBarcodes(prev => prev.filter(b => b !== comp.boxBarcode.toUpperCase()));
                          } else {
                            setScannedBarcodes(prev => [...prev, comp.boxBarcode.toUpperCase()]);
                            playBeep(true);
                          }
                        }}
                        className={`mt-3 w-full py-1.5 text-xs font-bold rounded-lg border transition ${
                          scanned
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {scanned ? '✓ Verified (Click to uncheck)' : '+ Manual Verify This Box'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Prevents loading incomplete furniture sets into the delivery vehicle.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg transition"
            >
              Close
            </button>
            <button
              type="button"
              disabled={!isAllVerified}
              onClick={handleVerifyComplete}
              className={`px-5 py-2 text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 ${
                isAllVerified
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-slate-200 text-slate-600 font-semibold cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm Complete Kit & Save Assembly Log
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
