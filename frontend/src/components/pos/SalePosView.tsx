import { useState, useRef, useEffect, useCallback } from 'react';
import type { Product, CartItem, Customer } from '../../types/retailDaddy';

interface SalePosViewProps {
  products: Product[];
  customers: Customer[];
  isAdmin: boolean;
  onStockDeduct: (barcode: string, qty: number) => void;
  onRecordSaleInvoice: (invoiceData: any) => void;
}

export function SalePosView({
  products,
  customers,
  isAdmin,
  onStockDeduct,
  onRecordSaleInvoice
}: SalePosViewProps) {
  // Price Mode: Retail vs Wholesale (Ctrl+S toggles this)
  const [priceMode, setPriceMode] = useState<'RETAIL' | 'WHOLESALE'>('RETAIL');

  // Customer State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(customers[0] || {
    id: 'cust-1',
    name: 'Cash',
    phone: '1234567890',
    state: 'Kerala',
    balance: 0,
    loyaltyPoints: 0
  });
  const [customerPhone, setCustomerPhone] = useState('1234567890');
  const [customerState, setCustomerState] = useState('Kerala');

  // Fast Product Search Input State
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [entryQty, setEntryQty] = useState<number>(1);
  const [entryDiscPercent, setEntryDiscPercent] = useState<number>(0);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [heldCarts, setHeldCarts] = useState<{ id: string; time: string; items: CartItem[] }[]>([]);

  // Modals & UI States
  const [showThermalReceipt, setShowThermalReceipt] = useState(false);
  const [lastCompletedBill, setLastCompletedBill] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [weightScaleActive, setWeightScaleActive] = useState(false);
  const [selectedSalesman] = useState('Mahesh (Counter 1)');

  // Input refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Add product to cart with tax and rate calculation
  const addItemToCart = useCallback((product: Product, quantity: number = 1) => {
    // Check for expiration (Video 02 requirement)
    if (product.expDate) {
      const exp = new Date(product.expDate);
      const today = new Date();
      if (exp < today) {
        alert(`🚨 EXPIRED PRODUCT ALERT!\n\nProduct "${product.name}" expired on ${product.expDate}.\nRetail Daddy safety protocol blocks selling expired stock.`);
        return;
      }
    }

    const rate = priceMode === 'WHOLESALE' && product.wholesalePrice
      ? product.wholesalePrice
      : product.retailPrice;

    // Check if item already in cart
    const existingIndex = cart.findIndex(c => c.barcode === product.barcode);
    if (existingIndex > -1) {
      const updated = [...cart];
      const newQty = updated[existingIndex].qty + quantity;
      const taxable = newQty * rate * (1 - updated[existingIndex].discPercent / 100);
      const isInterState = customerState !== 'Kerala';
      const cgstAmt = isInterState ? 0 : (taxable * (product.cgst || 0)) / 100;
      const sgstAmt = isInterState ? 0 : (taxable * (product.sgst || 0)) / 100;
      const igstAmt = isInterState ? (taxable * (product.igst || 0)) / 100 : 0;
      const total = taxable + cgstAmt + sgstAmt + igstAmt;

      updated[existingIndex] = {
        ...updated[existingIndex],
        qty: newQty,
        taxable,
        cgstAmt,
        sgstAmt,
        igstAmt,
        total
      };
      setCart(updated);
      showToast(`Updated ${product.name} qty: ${newQty}`);
    } else {
      const isInterState = customerState !== 'Kerala';
      const discAmt = (rate * quantity * entryDiscPercent) / 100;
      const taxable = (rate * quantity) - discAmt;
      const cgstAmt = isInterState ? 0 : (taxable * (product.cgst || 0)) / 100;
      const sgstAmt = isInterState ? 0 : (taxable * (product.sgst || 0)) / 100;
      const igstAmt = isInterState ? (taxable * (product.igst || 0)) / 100 : 0;
      const total = taxable + cgstAmt + sgstAmt + igstAmt;

      const newItem: CartItem = {
        id: `item-${Date.now()}-${Math.random()}`,
        productId: product.id,
        pCode: product.pCode,
        name: product.name,
        hsn: product.hsn || '9403',
        barcode: product.barcode,
        qty: quantity,
        rate,
        mrp: product.mrp,
        purchasePrice: product.purchasePrice,
        discPercent: entryDiscPercent,
        discAmt,
        taxable,
        cgstPercent: isInterState ? 0 : (product.cgst || 0),
        sgstPercent: isInterState ? 0 : (product.sgst || 0),
        igstPercent: isInterState ? (product.igst || 0) : 0,
        cgstAmt,
        sgstAmt,
        igstAmt,
        total,
        salesman: selectedSalesman,
        commissionPercent: 2.5,
        commissionAmt: total * 0.025,
        stockId: product.id,
        points: Math.floor(total / 100),
        batch: product.batch,
        expDate: product.expDate,
        godown: product.godown,
        rack: product.rack
      };

      setCart(prev => [newItem, ...prev]);
      showToast(`Added ${product.name} (${priceMode === 'WHOLESALE' ? 'Wholesale' : 'Retail'} ₹${rate.toFixed(2)})`);
    }

    setSearchQuery('');
    setBarcodeInput('');
    setEntryQty(1);
    searchInputRef.current?.focus();
  }, [cart, customerState, entryDiscPercent, priceMode, selectedSalesman]);

  // Barcode Scan / Enter Handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const found = products.find(p => p.barcode === barcodeInput.trim());
    if (found) {
      addItemToCart(found, entryQty);
    } else {
      showToast(`❌ Barcode "${barcodeInput}" not found in database`);
    }
  };

  // Switch Price Mode (recomputes rates for existing cart items)
  const togglePriceMode = (newMode: 'RETAIL' | 'WHOLESALE') => {
    setPriceMode(newMode);
    setCart(prev =>
      prev.map(item => {
        const prod = products.find(p => p.id === item.productId);
        const newRate = newMode === 'WHOLESALE' && prod?.wholesalePrice
          ? prod.wholesalePrice
          : (prod?.retailPrice || item.rate);
        const taxable = item.qty * newRate * (1 - item.discPercent / 100);
        const isInterState = customerState !== 'Kerala';
        const cgstAmt = isInterState ? 0 : (taxable * item.cgstPercent) / 100;
        const sgstAmt = isInterState ? 0 : (taxable * item.sgstPercent) / 100;
        const igstAmt = isInterState ? (taxable * item.igstPercent) / 100 : 0;
        const total = taxable + cgstAmt + sgstAmt + igstAmt;
        return {
          ...item,
          rate: newRate,
          taxable,
          cgstAmt,
          sgstAmt,
          igstAmt,
          total
        };
      })
    );
    showToast(`Switched to ${newMode} Price Mode (Ctrl+S)`);
  };

  // Keyboard Shortcuts (F1, F4, Ctrl+S)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault();
        triggerQuickPay();
      } else if (e.key === 'F1') {
        e.preventDefault();
        setCart([]);
        showToast('New Bill Started [F1]');
      } else if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        togglePriceMode(priceMode === 'RETAIL' ? 'WHOLESALE' : 'RETAIL');
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  });

  // Calculate Totals
  const totalItems = cart.length;
  const totalQty = cart.reduce((sum, c) => sum + c.qty, 0);
  const totalDisc = cart.reduce((sum, c) => sum + c.discAmt, 0);
  const totalTax = cart.reduce((sum, c) => sum + (c.cgstAmt + c.sgstAmt + c.igstAmt), 0);
  const totalMrp = cart.reduce((sum, c) => sum + (c.mrp * c.qty), 0);
  const netPay = cart.reduce((sum, c) => sum + c.total, 0);

  // Gross profit computation (Visible in Admin role from Tut 11)
  const totalCost = cart.reduce((sum, c) => sum + (c.purchasePrice * c.qty), 0);
  const grossProfit = netPay - totalCost;
  const profitMarginPercent = netPay > 0 ? (grossProfit / netPay) * 100 : 0;

  // Trigger F4 Quick Pay
  const triggerQuickPay = () => {
    if (cart.length === 0) {
      showToast('⚠️ Cart is empty! Add products first.');
      return;
    }

    const billData = {
      invoiceNo: `GST-0025-2024/25`,
      date: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US'),
      customer: selectedCustomer,
      items: cart,
      totalItems,
      totalQty,
      totalDisc,
      totalTax,
      totalMrp,
      netPay,
      priceMode
    };

    // Deduct stock for each cart item
    cart.forEach(item => {
      onStockDeduct(item.barcode, item.qty);
    });

    onRecordSaleInvoice(billData);
    setLastCompletedBill(billData);
    setShowThermalReceipt(true);
    setCart([]);
    showToast(`✅ Bill Completed! Net Pay: ₹${netPay.toFixed(2)}`);
  };

  // Hold current cart
  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const holdEntry = {
      id: `hold-${Date.now()}`,
      time: new Date().toLocaleTimeString('en-US'),
      items: cart
    };
    setHeldCarts(prev => [holdEntry, ...prev]);
    setCart([]);
    showToast(`🔒 Cart parked into slot (${heldCarts.length + 1} held)`);
  };

  // Unhold cart
  const handleUnholdCart = (index: number = 0) => {
    if (heldCarts.length === 0) {
      showToast('No held carts available');
      return;
    }
    const retrieved = heldCarts[index];
    setCart(retrieved.items);
    setHeldCarts(prev => prev.filter((_, i) => i !== index));
    showToast('🔓 Cart recalled successfully');
  };

  return (
    <div className="rd-window">
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'absolute',
          top: '45px',
          right: '20px',
          background: '#065f46',
          color: '#ffffff',
          padding: '8px 16px',
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          zIndex: 999
        }}>
          {toastMessage}
        </div>
      )}

      {/* POS HEADER (FROM FRAME 185) */}
      <div className="rd-pos-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="rd-pos-title">POINT OF SALE</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', fontWeight: 'bold' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="priceMode"
                checked={priceMode === 'RETAIL'}
                onChange={() => togglePriceMode('RETAIL')}
              />
              <span>Retail Price</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="priceMode"
                checked={priceMode === 'WHOLESALE'}
                onChange={() => togglePriceMode('WHOLESALE')}
              />
              <span>Wholesale Price</span>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', fontWeight: 'bold' }}>
          <span>Invoice No : GST-0025-2024/25</span>
          <span>Date : {new Date().toLocaleDateString('en-GB')}</span>
          <span>Tax : GST (Auto)</span>
        </div>
      </div>

      {/* CUSTOMER ENTRY STRIP (ROW 1) */}
      <div className="rd-pos-strip" style={{ background: '#f1f5f9' }}>
        <button
          className="rd-grid-btn"
          style={{ background: '#2563eb', color: '#fff', fontWeight: 'bold' }}
          onClick={() => showToast('Customer quick-add')}
        >
          👤+ Customer
        </button>

        <input
          type="text"
          className="rd-pos-input"
          style={{ width: '130px' }}
          value={selectedCustomer.name}
          onChange={e => setSelectedCustomer({ ...selectedCustomer, name: e.target.value })}
          placeholder="Customer Name"
        />

        <input
          type="text"
          className="rd-pos-input"
          style={{ width: '120px', background: '#fef08a', fontWeight: 'bold' }}
          value={customerPhone}
          onChange={e => {
            setCustomerPhone(e.target.value);
            const found = customers.find(c => c.phone === e.target.value);
            if (found) {
              setSelectedCustomer(found);
              setCustomerState(found.state);
              showToast(`Customer: ${found.name} (Dr Balance: ₹${found.balance.toFixed(2)})`);
            }
          }}
          placeholder="Mobile Number"
        />

        <select
          className="rd-pos-input"
          style={{ width: '110px' }}
          value={customerState}
          onChange={e => setCustomerState(e.target.value)}
        >
          <option value="Kerala">Kerala (Intra)</option>
          <option value="Karnataka">Karnataka (IGST)</option>
          <option value="Tamil Nadu">Tamil Nadu (IGST)</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold' }}>
          <input type="checkbox" />
          <span>W-Barcode</span>
        </label>

        {selectedCustomer.balance > 0 && (
          <div style={{ marginLeft: 'auto', background: '#fee2e2', border: '1px solid #ef4444', color: '#991b1b', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>
            ⚠️ Outstanding Due: ₹{selectedCustomer.balance.toFixed(2)}
          </div>
        )}
      </div>

      {/* PRODUCT SEARCH & INPUT STRIP (ROW 2) */}
      <div className="rd-pos-strip">
        <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Product :</span>
        <div style={{ position: 'relative' }}>
          <input
            ref={searchInputRef}
            type="text"
            className="rd-pos-input"
            style={{ width: '260px', background: '#fef08a', fontWeight: 'bold' }}
            placeholder="Type Name or Scan Barcode..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: '320px',
              maxHeight: '220px',
              overflowY: 'auto',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
              zIndex: 100
            }}>
              {products
                .filter(p =>
                  p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.barcode.includes(searchQuery)
                )
                .slice(0, 8)
                .map(p => (
                  <div
                    key={p.id}
                    style={{
                      padding: '6px 10px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '11px'
                    }}
                    onMouseDown={() => addItemToCart(p, entryQty)}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                      <div style={{ color: '#64748b' }}>Barcode: {p.barcode} | Stock: {p.openingStock}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>
                      ₹{(priceMode === 'WHOLESALE' && p.wholesalePrice ? p.wholesalePrice : p.retailPrice).toFixed(2)}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <form onSubmit={handleBarcodeSubmit} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Barcode :</span>
          <input
            ref={barcodeInputRef}
            type="text"
            className="rd-pos-input"
            style={{ width: '120px' }}
            placeholder="Scan Barcode"
            value={barcodeInput}
            onChange={e => setBarcodeInput(e.target.value)}
          />
        </form>

        <span style={{ fontWeight: 'bold', fontSize: '11px' }}>QTY :</span>
        <input
          type="number"
          step="0.001"
          className="rd-pos-input"
          style={{ width: '60px', textAlign: 'center', fontWeight: 'bold' }}
          value={entryQty}
          min="1"
          onChange={e => setEntryQty(Math.max(1, Number(e.target.value) || 1))}
        />

        <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Disc % :</span>
        <input
          type="number"
          step="0.1"
          className="rd-pos-input"
          style={{ width: '55px', textAlign: 'center' }}
          value={entryDiscPercent}
          onChange={e => setEntryDiscPercent(Number(e.target.value) || 0)}
        />

        <div className="rd-net-pay-box">
          <span>Net Pay :</span>
          <span>₹ {netPay.toFixed(2)}</span>
        </div>
      </div>

      {/* OPERATIONS ACTION STRIP (ROW 3) */}
      <div className="rd-pos-strip" style={{ background: '#e2e8f0' }}>
        <button className="rd-grid-btn" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 'bold' }}>
          👤 {selectedSalesman}
        </button>

        <button
          className="rd-grid-btn"
          style={{ background: '#c084fc', color: '#fff', fontWeight: 'bold' }}
          onClick={handleHoldCart}
          title="Park bill (Hold)"
        >
          🔒 Hold
        </button>

        <button
          className="rd-grid-btn"
          style={{ background: '#a855f7', color: '#fff', fontWeight: 'bold' }}
          onClick={() => handleUnholdCart(0)}
          title="Recall held bill"
        >
          🔓 Unhold ({heldCarts.length})
        </button>

        <button
          className="rd-grid-btn"
          style={{
            background: weightScaleActive ? '#22c55e' : '#dc2626',
            color: '#fff',
            fontWeight: 'bold'
          }}
          onClick={() => {
            setWeightScaleActive(!weightScaleActive);
            showToast(weightScaleActive ? 'Weighing scale link OFF' : 'RS-232 Weighing scale CONNECTED');
          }}
        >
          ⚖️ Weigh Scale: {weightScaleActive ? 'ON' : 'OFF'}
        </button>

        <button className="rd-grid-btn" onClick={() => showToast('Estimate Mode Ready')}>
          📄 Estimate
        </button>

        <button className="rd-grid-btn" onClick={() => showToast('Quotation Mode Ready')}>
          📋 Quotation
        </button>

        <button className="rd-grid-btn" onClick={() => showToast('Online Delivery Orders Panel')}>
          🌐 Online Order
        </button>
      </div>

      {/* CENTRAL CART GRID */}
      <div className="rd-table-container">
        <table className="rd-data-table">
          <thead>
            <tr>
              <th className="th-green" style={{ width: '40px', textAlign: 'center' }}>#</th>
              <th className="th-green" style={{ width: '80px' }}>HSN Code</th>
              <th className="th-green">Product Name</th>
              <th className="th-green" style={{ width: '110px' }}>Barcode</th>
              <th className="th-green" style={{ width: '60px', textAlign: 'center' }}>Qty</th>
              <th className="th-green" style={{ width: '80px', textAlign: 'right' }}>Rate</th>
              <th className="th-green" style={{ width: '65px', textAlign: 'right' }}>Disc %</th>
              <th className="th-green" style={{ width: '75px', textAlign: 'right' }}>Amt</th>
              <th className="th-green" style={{ width: '90px', textAlign: 'right' }}>Total</th>
              <th className="th-green" style={{ width: '120px' }}>SalesMan</th>
              <th className="th-green" style={{ width: '50px', textAlign: 'right' }}>Points</th>
              <th className="th-red" style={{ width: '45px', textAlign: 'center' }}>Del</th>
            </tr>
          </thead>
          <tbody>
            {cart.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
                  🛒 Cart is empty. Scan a barcode above or search by product name to begin billing.
                </td>
              </tr>
            ) : (
              cart.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                  <td>{item.hsn}</td>
                  <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                  <td>{item.barcode}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        onClick={() => {
                          if (item.qty > 1) {
                            const newQty = item.qty - 1;
                            const taxable = newQty * item.rate * (1 - item.discPercent / 100);
                            const total = taxable + (taxable * (item.cgstPercent + item.sgstPercent + item.igstPercent)) / 100;
                            setCart(cart.map(c => c.id === item.id ? { ...c, qty: newQty, taxable, total } : c));
                          }
                        }}
                      >
                        -
                      </button>
                      <span>{item.qty}</span>
                      <button
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        onClick={() => {
                          const newQty = item.qty + 1;
                          const taxable = newQty * item.rate * (1 - item.discPercent / 100);
                          const total = taxable + (taxable * (item.cgstPercent + item.sgstPercent + item.igstPercent)) / 100;
                          setCart(cart.map(c => c.id === item.id ? { ...c, qty: newQty, taxable, total } : c));
                        }}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{item.rate.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>{item.discPercent.toFixed(1)}</td>
                  <td style={{ textAlign: 'right' }}>{item.taxable.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: '900', color: '#15803d' }}>
                    {item.total.toFixed(2)}
                  </td>
                  <td style={{ fontSize: '11px' }}>{item.salesman}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#7c3aed' }}>
                    {item.points}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}
                      onClick={() => setCart(cart.filter(c => c.id !== item.id))}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* BOTTOM SUMMARY & F-KEY PANEL (FRAME 185) */}
      <div className="rd-pos-bottom-matrix">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <table className="rd-summary-table">
            <thead>
              <tr>
                <th>ITEMS</th>
                <th>QTY</th>
                <th>DISCOUNT</th>
                <th>TAX</th>
                <th>BILL MRP</th>
                <th>BILL NET AMT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{totalItems}</td>
                <td>{totalQty.toFixed(3)}</td>
                <td>₹ {totalDisc.toFixed(2)}</td>
                <td>₹ {totalTax.toFixed(2)}</td>
                <td>₹ {totalMrp.toFixed(2)}</td>
                <td style={{ color: '#15803d', fontSize: '14px', fontWeight: '900' }}>
                  ₹ {netPay.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          {isAdmin && (
            <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: 'bold', background: '#e0f2fe', padding: '3px 8px', borderRadius: '4px' }}>
              📊 Admin View: Gross Profit: ₹{grossProfit.toFixed(2)} ({profitMarginPercent.toFixed(1)}% margin)
            </div>
          )}
        </div>

        {/* F-KEYS BUTTON BAR */}
        <div className="rd-pos-f-buttons">
          <button className="rd-f-btn new" onClick={() => { setCart([]); showToast('New Cart Started [F1]'); }}>
            <span>📄</span>
            <span>New [F1]</span>
          </button>

          <button className="rd-f-btn update" onClick={() => showToast('Invoice updated')}>
            <span>🔄</span>
            <span>Update [F3]</span>
          </button>

          <button className="rd-f-btn quick-pay" onClick={triggerQuickPay}>
            <span>⚡✔</span>
            <span>Quick Pay [F4]</span>
          </button>

          <button className="rd-f-btn old-bill" onClick={() => showToast('Opening Old Bills Search [F5]')}>
            <span>📁</span>
            <span>Old Bill [F5]</span>
          </button>

          <button className="rd-f-btn print" onClick={() => { if (cart.length > 0) triggerQuickPay(); }}>
            <span>🖨️</span>
            <span>Print [F6]</span>
          </button>
        </div>
      </div>

      {/* 3-INCH THERMAL RECEIPT MODAL WITH UPI QR CODE */}
      {showThermalReceipt && lastCompletedBill && (
        <div className="rd-modal-overlay">
          <div className="rd-dialog" style={{ width: '360px', maxHeight: '90vh' }}>
            <div className="rd-dialog-titlebar">
              <span>Thermal Receipt (3-Inch Print Preview)</span>
              <button
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}
                onClick={() => setShowThermalReceipt(false)}
              >
                ✕
              </button>
            </div>
            <div className="rd-dialog-body" style={{ background: '#f8fafc', padding: '16px' }}>
              <div style={{
                background: '#ffffff',
                padding: '16px',
                border: '1px dashed #94a3b8',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#000000'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '900', fontSize: '14px' }}>SHREE VINAYAKA FURNITURES</div>
                  <div style={{ fontSize: '10px' }}>Main Road, Near Temple, Karnataka</div>
                  <div style={{ fontSize: '10px' }}>GSTIN: 29AAAAA0000A1Z5 | Ph: 9845012345</div>
                  <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                    <span>Inv: {lastCompletedBill.invoiceNo}</span>
                    <span>{lastCompletedBill.date}</span>
                  </div>
                  <div style={{ textAlign: 'left', fontSize: '10px' }}>
                    Customer: {lastCompletedBill.customer.name} ({lastCompletedBill.customer.phone})
                  </div>
                  <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />
                </div>

                {/* Items */}
                <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse', marginBottom: '8px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <th style={{ textAlign: 'left' }}>Item</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Rate</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastCompletedBill.items.map((it: CartItem) => (
                      <tr key={it.id}>
                        <td style={{ textAlign: 'left' }}>{it.name.substring(0, 16)}</td>
                        <td style={{ textAlign: 'center' }}>{it.qty}</td>
                        <td style={{ textAlign: 'right' }}>{it.rate.toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>{it.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>Total Items: {lastCompletedBill.totalItems}</span>
                  <span>Total Qty: {lastCompletedBill.totalQty}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Tax (GST):</span>
                  <span>₹ {lastCompletedBill.totalTax.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '900', marginTop: '4px' }}>
                  <span>NET PAYABLE:</span>
                  <span>₹ {lastCompletedBill.netPay.toFixed(2)}</span>
                </div>

                {/* UPI QR CODE */}
                <div style={{ textAlign: 'center', marginTop: '12px', padding: '8px', background: '#f1f5f9', borderRadius: '6px' }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=upi://pay?pa=rakeshleela5@okhdfcbank&pn=ShreeVinayakaFurnitures&am=${lastCompletedBill.netPay.toFixed(2)}&cu=INR`}
                    alt="UPI Payment QR"
                    style={{ width: '90px', height: '90px', margin: '0 auto' }}
                  />
                  <div style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '4px' }}>Scan & Pay with GPay / PhonePe / Paytm</div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '10px' }}>
                  *** THANK YOU! VISIT AGAIN ***<br />
                  Powered by Retail Daddy 1.6
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <button
                  className="rd-grid-btn"
                  onClick={() => setShowThermalReceipt(false)}
                >
                  Close
                </button>
                <button
                  className="rd-grid-btn"
                  style={{ background: '#16a34a', color: '#ffffff', fontWeight: 'bold' }}
                  onClick={() => {
                    window.print();
                    setShowThermalReceipt(false);
                  }}
                >
                  🖨️ Send to Thermal Printer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
