import React, { useState } from 'react';
import type { Product, ProductBoxComponent } from '../../types/retailDaddy';
import { generateFurnitureSku } from '../../api/client';
import { Sparkles, Package, X, Check, Barcode as BarcodeIcon, Tag } from 'lucide-react';

interface GodrejSkuGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (prod: Product) => void;
  existingProductsCount: number;
}

const CATEGORY_MAP: Record<string, { code: string; defaultBoxes: string[] }> = {
  'STEEL ALMIRAHS & STORWELS': {
    code: 'ALM',
    defaultBoxes: ['Steel Body & Side Panels', 'Doors & Internal Shelves', 'Lock Hardware, Handles & Mirror']
  },
  'BEDS & BEDROOM': {
    code: 'BED',
    defaultBoxes: ['Headboard & Footboard Frame', 'Side Rails & Central Stiffener', 'Storage Box Unit & Hydraulic Lifters', 'Hardware & Fitting Accessories']
  },
  'SOFAS & LIVING': {
    code: 'SOF',
    defaultBoxes: ['3-Seater Main Frame & Seat', '1-Seater Lounger A', '1-Seater Lounger B & Cushions']
  },
  'DINING SETS': {
    code: 'DIN',
    defaultBoxes: ['Table Top & Apron Frame', 'Legs & Assembly Hardware Kit', 'Chairs Pack (Set of 4/6)']
  },
  'OFFICE DESKS': {
    code: 'DSK',
    defaultBoxes: ['Executive Desktop & Cable Port', 'Metal Understructure & Modesty Panel', '3-Drawer Mobile Pedestal Unit']
  },
  'OFFICE CHAIRS': {
    code: 'CHR',
    defaultBoxes: ['Cushioned Seat & Tilt Mechanism', 'Gaslift Piston, 5-Star Base & Casters']
  }
};

export const GodrejSkuGeneratorModal: React.FC<GodrejSkuGeneratorModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  existingProductsCount
}) => {
  if (!isOpen) return null;

  const [brand, setBrand] = useState<'GDJ' | 'SVF'>('GDJ');
  const [selectedCategory, setSelectedCategory] = useState<string>('BEDS & BEDROOM');
  const [modelName, setModelName] = useState<string>('Centurion');
  const [variant, setVariant] = useState<string>('King');
  const [mrp, setMrp] = useState<number>(45000);
  const [retailPrice, setRetailPrice] = useState<number>(38500);
  const [purchasePrice, setPurchasePrice] = useState<number>(27000);
  const [openingStock, setOpeningStock] = useState<number>(5);
  const [godown, setGodown] = useState<string>('Main Godown');
  const [rack, setRack] = useState<string>('Bay 1');

  // Multi-box knockdown kit
  const [isKnockdown, setIsKnockdown] = useState<boolean>(true);
  const [totalBoxes, setTotalBoxes] = useState<number>(3);
  const [boxNames, setBoxNames] = useState<string[]>([
    'Headboard & Footboard Frame',
    'Side Rails & Central Stiffener',
    'Storage Box Unit & Hydraulic Lifters'
  ]);

  const [generatedSku, setGeneratedSku] = useState<string>('');
  const [generatedBarcode, setGeneratedBarcode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Update box count
  const handleBoxCountChange = (count: number) => {
    const safeCount = Math.max(1, Math.min(8, count));
    setTotalBoxes(safeCount);
    const defaults = CATEGORY_MAP[selectedCategory]?.defaultBoxes || [];
    const nextBoxes = Array.from({ length: safeCount }, (_, i) => {
      return boxNames[i] || defaults[i] || `Component Package Box ${i + 1}`;
    });
    setBoxNames(nextBoxes);
  };

  // Auto-generate SKU & Barcodes
  const handleGenerateSku = async () => {
    setIsGenerating(true);
    try {
      const catCode = CATEGORY_MAP[selectedCategory]?.code || 'FURN';
      const res = await generateFurnitureSku({
        brand: brand,
        categoryCode: catCode,
        modelName: modelName.trim(),
        variant: variant.trim(),
        isKnockdown: isKnockdown,
        totalBoxes: isKnockdown ? totalBoxes : 1,
        customBoxNames: boxNames
      });
      setGeneratedSku(res.generatedSku);
      setGeneratedBarcode(res.generatedBarcode);
    } catch {
      // Offline fallback generator
      const catCode = CATEGORY_MAP[selectedCategory]?.code || 'FURN';
      const cleanModel = modelName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
      const varPart = variant ? `-${variant.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4)}` : '';
      const fallbackSku = `${brand}-${catCode}-${cleanModel}${varPart}-${String(existingProductsCount + 1).padStart(3, '0')}`;
      setGeneratedSku(fallbackSku);
      setGeneratedBarcode(fallbackSku);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save product to catalog
  const handleCreateProduct = () => {
    const finalSku = generatedSku || `${brand}-${CATEGORY_MAP[selectedCategory]?.code || 'FURN'}-${modelName.toUpperCase().slice(0, 6)}-001`;
    const finalBarcode = generatedBarcode || finalSku;
    const fullName = `${brand === 'GDJ' ? 'Godrej Interio' : 'Shree Vinayaka'} ${modelName} ${variant ? `(${variant})` : ''}`.trim();

    const boxComps: ProductBoxComponent[] = isKnockdown
      ? boxNames.map((name, idx) => ({
          boxNumber: idx + 1,
          totalBoxes: totalBoxes,
          componentName: name,
          boxBarcode: `${finalSku}-BX${idx + 1}`,
          boxSku: `${finalSku}-BX${idx + 1}`,
          dimensions: '200x120x15 cm',
          weightKg: 25,
          godown: godown,
          rack: rack,
          status: 'InStock'
        }))
      : [];

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      pCode: finalSku,
      name: fullName,
      category: selectedCategory,
      subCategory: 'PREMIUM FURNITURE',
      purchasePrice: Number(purchasePrice) || 0,
      mrp: Number(mrp) || 0,
      retailPrice: Number(retailPrice) || 0,
      openingStock: Number(openingStock) || 0,
      barcode: finalBarcode,
      cessPercent: 0,
      godown: godown,
      rack: rack,
      hsn: '9403',
      salesUnit: 'Pcs',
      cgst: 9,
      sgst: 9,
      igst: 18,
      sTax: 'Inclusive',
      pTax: 'Exclusive',
      minStock: 2,
      isKnockdown: isKnockdown,
      totalBoxesCount: isKnockdown ? totalBoxes : 1,
      assemblyRequired: isKnockdown,
      assemblyLeadTimeMins: isKnockdown ? 45 : 0,
      boxComponents: boxComps
    };

    onAddProduct(newProduct);
    setSuccessToast(`✓ Created ${newProduct.name} with ${boxComps.length} Child Box Barcodes!`);
    setTimeout(() => {
      setSuccessToast(null);
      onClose();
    }, 1500);
  };

  const previewSku = generatedSku || `${brand}-${CATEGORY_MAP[selectedCategory]?.code || 'BED'}-${modelName.toUpperCase().slice(0, 6)}-${variant.toUpperCase().slice(0, 4) || 'STD'}-001`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
              <Sparkles className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Godrej Smart Auto-SKU & Multi-Box Generator
                <span className="text-xs bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  Automated BOM
                </span>
              </h2>
              <p className="text-xs text-emerald-200">
                Instantly generates standardized brand SKUs, 1D/2D Barcodes, and knockdown flat-pack carton codes.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Brand */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Brand / Dealership:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'GDJ', label: 'Godrej Interio (GDJ)' },
                  { id: 'SVF', label: 'Shree Vinayaka (SVF)' }
                ].map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBrand(b.id as any)}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      brand === b.id
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Furniture Category:</label>
              <select
                value={selectedCategory}
                onChange={e => {
                  setSelectedCategory(e.target.value);
                  const defs = CATEGORY_MAP[e.target.value]?.defaultBoxes || [];
                  setBoxNames(defs.slice(0, totalBoxes));
                }}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {Object.keys(CATEGORY_MAP).map(cat => (
                  <option key={cat} value={cat}>
                    {cat} ({CATEGORY_MAP[cat].code})
                  </option>
                ))}
              </select>
            </div>

            {/* Model Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Model / Product Name:</label>
              <input
                type="text"
                value={modelName}
                onChange={e => setModelName(e.target.value)}
                placeholder="e.g. Centurion, Slimline, Maestro"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              />
            </div>

            {/* Variant / Size */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Variant / Size / Color:</label>
              <input
                type="text"
                value={variant}
                onChange={e => setVariant(e.target.value)}
                placeholder="e.g. King, 3-Door, Teak, Maroon"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              />
            </div>

            {/* Pricing Details */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">M.R.P (₹):</label>
              <input
                type="number"
                value={mrp}
                onChange={e => setMrp(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Showroom Retail Offer Price (₹):</label>
              <input
                type="number"
                value={retailPrice}
                onChange={e => setRetailPrice(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Purchase / Cost Price (₹):</label>
              <input
                type="number"
                value={purchasePrice}
                onChange={e => setPurchasePrice(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Opening Stock (Units):</label>
              <input
                type="number"
                value={openingStock}
                onChange={e => setOpeningStock(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Godown Storage Location:</label>
              <input
                type="text"
                value={godown}
                onChange={e => setGodown(e.target.value)}
                placeholder="e.g. Main Godown, Showroom Floor"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rack / Bay / Slot:</label>
              <input
                type="text"
                value={rack}
                onChange={e => setRack(e.target.value)}
                placeholder="e.g. Bay 1, Rack C"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              />
            </div>
          </div>

          {/* Knockdown Multi-Box Flat-Pack Configuration */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isKnockdown}
                  onChange={e => setIsKnockdown(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-700" />
                  Knockdown Flat-Pack Kit (Arrives in multiple carton packages)
                </span>
              </label>

              {isKnockdown && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Total Boxes:</span>
                  <div className="flex items-center gap-1">
                    {[2, 3, 4, 5].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleBoxCountChange(num)}
                        className={`w-7 h-7 text-xs font-bold rounded-lg border transition ${
                          totalBoxes === num
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isKnockdown && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="block text-[11px] font-bold text-slate-600 uppercase">
                  Box Breakdown & Component Labels:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {boxNames.slice(0, totalBoxes).map((bName, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                        BOX {idx + 1}/{totalBoxes}
                      </span>
                      <input
                        type="text"
                        value={bName}
                        onChange={e => {
                          const updated = [...boxNames];
                          updated[idx] = e.target.value;
                          setBoxNames(updated);
                        }}
                        className="flex-1 text-xs text-slate-800 outline-none font-medium"
                        placeholder={`Component description for Box ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Generated SKU & Child Barcode Preview Box */}
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-emerald-700" />
                Generated Master SKU & Child Box Codes Preview:
              </span>
              <button
                type="button"
                onClick={handleGenerateSku}
                disabled={isGenerating}
                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isGenerating ? 'Generating...' : 'Refresh Next SKU'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-lg border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Master Product SKU</span>
                <span className="font-mono text-sm font-bold text-slate-900">{previewSku}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Master Barcode</span>
                <span className="font-mono text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                  <BarcodeIcon className="w-4 h-4" />
                  {generatedBarcode || previewSku}
                </span>
              </div>
            </div>

            {isKnockdown && (
              <div className="bg-white p-3 rounded-lg border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                  Child Box Barcodes (To be pasted on each warehouse carton):
                </span>
                <div className="flex flex-wrap gap-2">
                  {boxNames.slice(0, totalBoxes).map((name, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-200"
                    >
                      <span className="text-emerald-700">📦 Box {idx + 1}:</span>
                      <span>{previewSku}-BX{idx + 1}</span>
                      <span className="text-slate-400 font-sans text-[10px]">({name.slice(0, 16)}...)</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Success Toast Banner */}
          {successToast && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-700" />
              {successToast}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Complies with Godrej Interio dealer BOM & knockdown inventory standards.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateProduct}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save & Add to Product Catalog
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
