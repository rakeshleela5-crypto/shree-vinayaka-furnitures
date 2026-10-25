import { useState, useEffect } from 'react';
import type { Product, Customer, CompanyInfo, CartItem, QuotationRecord, BillTemplateConfig, CrmLead } from '../../types/retailDaddy';
import { BillTemplatePreview } from './BillTemplatePreview';
import { api } from '../../api/client';

interface QuotationViewProps {
  products: Product[];
  customers: Customer[];
  companyInfo: CompanyInfo;
  quotations: QuotationRecord[];
  onSaveQuotation: (quot: QuotationRecord) => void;
  onDeleteQuotation?: (id: string) => void;
  onConvertToInvoice?: (completedBill: any) => Promise<any>;
  onClose: () => void;
  activeLead?: CrmLead | null;
  onClearActiveLead?: () => void;
  onOpenCustomerModal?: () => void;
  onOpenProductModal?: () => void;
}

export function QuotationView({
  products,
  customers,
  companyInfo,
  quotations,
  onSaveQuotation,
  onDeleteQuotation,
  onConvertToInvoice,
  onClose,
  activeLead,
  onClearActiveLead,
  onOpenCustomerModal,
  onOpenProductModal
}: QuotationViewProps) {
  // Navigation index
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const getDefaultValidityDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString('en-GB');
  };

  // Form State
  const [quotationNo, setQuotationNo] = useState<string>(() => {
    const yr = new Date().getFullYear();
    const nextNum = (quotations?.length || 0) + 1;
    return `SVF-QUOT-${yr}/${String(nextNum).padStart(4, '0')}`;
  });
  const [date, setDate] = useState<string>(new Date().toLocaleDateString('en-GB'));
  const [validUntil, setValidUntil] = useState<string>(getDefaultValidityDate());
  const [quotationStatus, setQuotationStatus] = useState<string>('DRAFT');
  const [convertedInvoiceNo, setConvertedInvoiceNo] = useState<string | null>(null);
  const [converting, setConverting] = useState<boolean>(false);
  const [remarks, setRemarks] = useState<string>('Godrej Interio Showroom Quotation');

  // Customer State
  // Determine showroom home state (Shree Vinayaka Furnitures is based in Karnataka)
  const defaultShowroomState = (companyInfo?.state && companyInfo.state !== 'Kerala') ? companyInfo.state : 'Karnataka';

  // Customer State
  const initialCustomer = customers && customers.length > 0 ? customers[0] : null;
  const [customerId, setCustomerId] = useState<string>(initialCustomer?.id || 'CUST-001');
  const [contactNo, setContactNo] = useState<string>(initialCustomer?.phone || '');
  const [customerName, setCustomerName] = useState<string>(initialCustomer?.name || 'Walk-in Client');
  const [customerEmail, setCustomerEmail] = useState<string>(initialCustomer?.email || '');
  const [state, setState] = useState<string>(
    (initialCustomer?.state && initialCustomer.state !== 'Kerala') ? initialCustomer.state : defaultShowroomState
  );
  const [gstin, setGstin] = useState<string>(initialCustomer?.gstin || '');

  // Product Selection & Math State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(products[0] || null);
  const [barcode, setBarcode] = useState<string>(products[0]?.barcode || '8901101');
  const [productName, setProductName] = useState<string>(products[0]?.name || 'Godrej Interio Slimline 3-Door');
  const [hsnCode, setHsnCode] = useState<string>(products[0]?.hsn || '94031010');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>(products[0]?.salesUnit || 'PCS');
  const [priceType, setPriceType] = useState<'RETAIL' | 'WHOLESALE'>('RETAIL');
  const [priceMainUnit, setPriceMainUnit] = useState<number>(products[0]?.retailPrice || 31500);
  const [discType, setDiscType] = useState<string>('%');
  const [discPercent, setDiscPercent] = useState<number>(0);
  const [discAmt, setDiscAmt] = useState<number>(0);
  const [saleTaxType, setSaleTaxType] = useState<'Inclusive' | 'Exclusive'>('Inclusive');
  const [cgstRate, setCgstRate] = useState<number>(products[0]?.cgst || 9);
  const [sgstRate, setSgstRate] = useState<number>(products[0]?.sgst || 9);
  const [igstRate, setIgstRate] = useState<number>(products[0]?.igst || 0);
  const [cessRate, setCessRate] = useState<number>(products[0]?.cessPercent || 0);

  // Feature Options
  const [showProductImage, setShowProductImage] = useState<boolean>(true);
  const [roundOffChecked, setRoundOffChecked] = useState<boolean>(false);

  // Cart Items
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Print Preview Modal State
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Load active quotation if exists
  useEffect(() => {
    if (quotations.length > 0 && quotations[currentIndex]) {
      const q = quotations[currentIndex];
      setQuotationNo(q.quotationNo);
      setDate(q.date);
      setValidUntil(q.validUntil || getDefaultValidityDate());
      setQuotationStatus(q.status || 'DRAFT');
      setConvertedInvoiceNo(q.convertedInvoiceNo || null);
      setRemarks(q.remarks || '');
      setCustomerId(q.customerId);
      setCustomerName(q.customerName);
      setContactNo(q.contactNo);
      setCustomerEmail(q.email || (customers.find(c => c.id === q.customerId)?.email) || '');
      setState(q.state);
      setGstin(q.gstin || '');
      setCartItems(q.items || []);
    }
  }, [currentIndex, quotations]);

  // 🌟 CRM LEAD AUTO-INTAKE INTO QUOTATION
  useEffect(() => {
    if (activeLead) {
      setCustomerName(activeLead.customerName);
      setContactNo(activeLead.phone);
      if ((activeLead as any).email) setCustomerEmail((activeLead as any).email);
      setRemarks(`Showroom CRM Lead Quotation - Interest: ${activeLead.furnitureInterest || 'Showroom Furniture'}`);
      if (activeLead.furnitureInterest) {
        const found = products.find(p =>
          p.name.toLowerCase().includes(activeLead.furnitureInterest.toLowerCase()) ||
          activeLead.furnitureInterest.toLowerCase().includes(p.name.toLowerCase())
        );
        if (found) {
          setSelectedProduct(found);
          setBarcode(found.barcode);
          setProductName(found.name);
          setPriceMainUnit(found.retailPrice);
          setUnit(found.salesUnit || 'PCS');
          showToast(`✓ Quotation initialized for CRM Lead: ${activeLead.customerName} (${found.name})`);
        } else {
          showToast(`✓ Quotation initialized for CRM Lead: ${activeLead.customerName}`);
        }
      } else {
        showToast(`✓ Quotation initialized for CRM Lead: ${activeLead.customerName}`);
      }
      if (onClearActiveLead) onClearActiveLead();
    }
  }, [activeLead, products, onClearActiveLead]);

  // F1 / F3 Global Shortcuts for Customer Directory and Product List
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1' && onOpenCustomerModal) {
        e.preventDefault();
        onOpenCustomerModal();
      } else if (e.key === 'F3' && onOpenProductModal) {
        e.preventDefault();
        onOpenProductModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenCustomerModal, onOpenProductModal]);

  // Product Auto-Fill
  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setBarcode(prod.barcode);
    setProductName(prod.name);
    setHsnCode(prod.hsn || '9403');
    setUnit(prod.salesUnit || 'PCS');
    const rate = priceType === 'WHOLESALE' ? (prod.wholesalePrice || prod.retailPrice) : prod.retailPrice;
    setPriceMainUnit(rate);
    setCgstRate(prod.cgst ?? 9);
    setSgstRate(prod.sgst ?? 9);
    setIgstRate(prod.igst || 0);
    setCessRate(prod.cessPercent || 0);
    setSaleTaxType((prod.sTax as any) || 'Inclusive');
  };

  const handleBarcodeChange = (val: string) => {
    setBarcode(val);
    const found = products.find(p => p.barcode === val || p.id === val);
    if (found) handleSelectProduct(found);
  };

  // Tax Math calculations for currently staged product
  const totalTaxRate = cgstRate + sgstRate + igstRate + cessRate;
  const rawSubTotal = quantity * priceMainUnit;
  const currentDiscAmt = discType === '%' ? (rawSubTotal * (discPercent / 100)) : discAmt;
  const effectiveTotal = Math.max(0, rawSubTotal - currentDiscAmt);

  let stagedTaxable = effectiveTotal;
  let stagedCgst = 0;
  let stagedSgst = 0;
  let stagedIgst = 0;
  let stagedCess = 0;

  if (saleTaxType === 'Inclusive' && totalTaxRate > 0) {
    stagedTaxable = Number((effectiveTotal / (1 + totalTaxRate / 100)).toFixed(2));
    stagedCgst = Number((stagedTaxable * (cgstRate / 100)).toFixed(2));
    stagedSgst = Number((stagedTaxable * (sgstRate / 100)).toFixed(2));
    stagedIgst = Number((stagedTaxable * (igstRate / 100)).toFixed(2));
    stagedCess = Number((stagedTaxable * (cessRate / 100)).toFixed(2));
  } else {
    stagedTaxable = Number(effectiveTotal.toFixed(2));
    stagedCgst = Number((stagedTaxable * (cgstRate / 100)).toFixed(2));
    stagedSgst = Number((stagedTaxable * (sgstRate / 100)).toFixed(2));
    stagedIgst = Number((stagedTaxable * (igstRate / 100)).toFixed(2));
    stagedCess = Number((stagedTaxable * (cessRate / 100)).toFixed(2));
  }

  // Cart Totals
  const sumSubTotal = cartItems.reduce((acc, it) => acc + it.taxable, 0);
  const sumCgst = cartItems.reduce((acc, it) => acc + it.cgstAmt, 0);
  const sumSgst = cartItems.reduce((acc, it) => acc + it.sgstAmt, 0);
  const sumIgst = cartItems.reduce((acc, it) => acc + it.igstAmt, 0);
  const sumCess = cartItems.reduce((acc, it) => acc + (it.cessAmt || 0), 0);
  const rawTotal = cartItems.reduce((acc, it) => acc + it.total, 0);
  const roundOffVal = roundOffChecked ? Number((Math.round(rawTotal) - rawTotal).toFixed(2)) : 0;
  const grandTotal = Number((rawTotal + roundOffVal).toFixed(2));

  // Add Item to Cart
  const handleAddToCart = () => {
    if (!productName || quantity <= 0) return;
    const newItem: CartItem = {
      id: 'qi-' + Date.now() + Math.random().toString(36).substring(2, 5),
      productId: selectedProduct?.id || 'prod-' + barcode,
      pCode: selectedProduct?.pCode || 'P-001',
      name: productName,
      barcode: barcode,
      mrp: selectedProduct?.mrp || priceMainUnit,
      rate: priceMainUnit,
      purchasePrice: selectedProduct?.purchasePrice || 0,
      qty: quantity,
      unit: unit,
      taxable: stagedTaxable,
      cgstPercent: cgstRate,
      cgstAmt: stagedCgst,
      sgstPercent: sgstRate,
      sgstAmt: stagedSgst,
      igstPercent: igstRate,
      igstAmt: stagedIgst,
      cessPercent: cessRate,
      cessAmt: stagedCess,
      discPercent: discType === '%' ? discPercent : 0,
      discAmt: currentDiscAmt,
      total: saleTaxType === 'Inclusive' ? effectiveTotal : Number((stagedTaxable + stagedCgst + stagedSgst + stagedIgst + stagedCess).toFixed(2)),
      salesman: '',
      commissionPercent: 0,
      commissionAmt: 0,
      stockId: '',
      points: 0,
      hsn: hsnCode,
      photo: selectedProduct?.photo
    };

    setCartItems(prev => [...prev, newItem]);
    setQuantity(1);
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(it => it.id !== id));
  };

  const handleSave = () => {
    const quot: QuotationRecord = {
      id: quotations[currentIndex]?.id || ('quot-' + Date.now()),
      quotationNo,
      date,
      validUntil,
      status: quotationStatus,
      convertedInvoiceNo: convertedInvoiceNo || undefined,
      customerId,
      customerName,
      contactNo,
      email: customerEmail,
      state,
      gstin,
      remarks,
      items: cartItems,
      subTotal: Number(sumSubTotal.toFixed(2)),
      cgst: Number(sumCgst.toFixed(2)),
      sgst: Number(sumSgst.toFixed(2)),
      igst: Number(sumIgst.toFixed(2)),
      cess: Number(sumCess.toFixed(2)),
      totalDiscount: cartItems.reduce((acc, it) => acc + it.discAmt, 0),
      roundOff: roundOffVal,
      grandTotal: grandTotal
    };
    onSaveQuotation(quot);
    showToast('✅ Quotation saved successfully: ' + quotationNo);
  };

  const handleNew = () => {
    const curYear = new Date().getFullYear();
    const nextNum = 'SVF-QUOT-' + String(quotations.length + 1).padStart(4, '0') + `/${curYear}-${(curYear + 1).toString().slice(-2)}`;
    setQuotationNo(nextNum);
    setDate(new Date().toLocaleDateString('en-GB'));
    setValidUntil(getDefaultValidityDate());
    setQuotationStatus('DRAFT');
    setConvertedInvoiceNo(null);
    setRemarks('');
    setCartItems([]);
  };

  const handleConvertToInvoice = async () => {
    if (cartItems.length === 0) {
      showToast('⚠️ Please add at least one furniture item to quotation first');
      return;
    }

    if (quotationStatus === 'CONVERTED') {
      const reConfirm = window.confirm(
        `This quotation has already been converted to Tax Invoice ${convertedInvoiceNo || ''}.\n\nDo you want to generate another tax invoice from it?`
      );
      if (!reConfirm) return;
    } else {
      const confirmed = window.confirm(
        `Convert Quotation ${quotationNo} to Official Tax Invoice?\n\n` +
        `Customer: ${customerName} (${contactNo})\n` +
        `Total Amount: ₹${grandTotal.toLocaleString('en-IN')}\n\n` +
        `This will:\n` +
        `1. Generate Official Tax Invoice\n` +
        `2. Deduct Showroom / Godown furniture inventory\n` +
        `3. Initiate Delivery Pipeline in Stage 1 (Booked)\n` +
        `4. Record transaction in Railway PostgreSQL`
      );
      if (!confirmed) return;
    }

    try {
      setConverting(true);
      const invoiceNo = `INV-${new Date().getFullYear().toString().slice(-2)}${(new Date().getFullYear() + 1).toString().slice(-2)}-${String(Date.now()).slice(-4)}`;

      const convertedBill = {
        id: `bill-${Date.now()}`,
        invoiceNo,
        date: new Date().toLocaleDateString('en-GB'),
        customer: dummyCustomer,
        items: cartItems,
        totalQty: cartItems.reduce((acc, it) => acc + it.qty, 0),
        grossAmount: rawTotal,
        totalDisc: cartItems.reduce((acc, it) => acc + it.discAmt, 0),
        subTotal: sumSubTotal,
        taxable: sumSubTotal,
        cgst: sumCgst,
        sgst: sumSgst,
        igst: sumIgst,
        cess: sumCess,
        totalTax: sumCgst + sumSgst + sumIgst + sumCess,
        roundOff: roundOffVal,
        grandTotal: grandTotal,
        paidAmount: grandTotal,
        balanceDue: 0,
        paymentMode: 'Cash',
        isAdvanceBooking: false,
        sellFromDisplay: false,
        remarks: `Converted from Quotation ${quotationNo}`
      };

      let result: any;
      if (onConvertToInvoice) {
        result = await onConvertToInvoice(convertedBill);
      } else {
        const idempotencyKey = `svf-quot-conv-${Date.now()}`;
        const invoicePayload = {
          invoice_no: invoiceNo,
          invoice_date: new Date().toISOString().split('T')[0],
          customer_id: customerId ? parseInt(customerId.replace(/\D/g, ''), 10) || null : null,
          customer_name: customerName || 'Walk-in Cash Customer',
          customer_phone: contactNo || '',
          payment_mode: 'Cash',
          gross_amount: Number(rawTotal.toFixed(2)),
          discount_amount: Number(cartItems.reduce((acc, it) => acc + it.discAmt, 0).toFixed(2)),
          coupon_discount: 0,
          gift_voucher_discount: 0,
          taxable_amount: Number(sumSubTotal.toFixed(2)),
          cgst_amount: Number(sumCgst.toFixed(2)),
          sgst_amount: Number(sumSgst.toFixed(2)),
          igst_amount: Number(sumIgst.toFixed(2)),
          round_off: roundOffVal,
          grand_total: grandTotal,
          paid_amount: grandTotal,
          balance_due: 0,
          is_advance_booking: false,
          delivery_state: 'BOOKED',
          remarks: `Converted from Quotation ${quotationNo}`,
          payments: [{ payment_mode: 'Cash', amount: grandTotal, status: 'Completed' }],
          items: cartItems.map((it: any) => {
            const matchingProd = products.find(p => (it.barcode && p.barcode === it.barcode) || (it.pCode && p.pCode === it.pCode) || p.name.toUpperCase() === (it.name || '').toUpperCase());
            const rawId = parseInt(String(matchingProd?.id || it.productId || it.id), 10);
            const validProdId = !isNaN(rawId) && rawId > 0 ? rawId : null;
            return {
              product_id: validProdId,
              barcode: it.barcode || matchingProd?.barcode || '',
              product_name: it.name || matchingProd?.name || '',
              qty: Number(it.qty || 1),
              rate: Number((it.rate || 0).toFixed(2)),
              discount_amount: Number((it.discAmt || 0).toFixed(2)),
              taxable_value: Number((it.taxable || ((it.rate || 0) * (it.qty || 1))).toFixed(2)),
              cgst_rate: Number((it.cgstPercent || 0).toFixed(2)),
              cgst_amount: Number((it.cgstAmt || 0).toFixed(2)),
              sgst_rate: Number((it.sgstPercent || 0).toFixed(2)),
              sgst_amount: Number((it.sgstAmt || 0).toFixed(2)),
              igst_rate: Number((it.igstPercent || 0).toFixed(2)),
              igst_amount: Number((it.igstAmt || 0).toFixed(2)),
              net_amount: Number((it.total || 0).toFixed(2)),
              batch_no: it.batch || null,
              serial_no: Array.isArray(it.serialNos) && it.serialNos.length > 0 ? it.serialNos.join(',') : null
            };
          })
        };
        result = await api.createSaleInvoice(invoicePayload, idempotencyKey);
      }

      const assignedInv = (result && (result.invoice_no || result.invoiceNo)) || invoiceNo;
      setQuotationStatus('CONVERTED');
      setConvertedInvoiceNo(assignedInv);

      // Save updated quotation with status
      const updatedQuot: QuotationRecord = {
        id: quotations[currentIndex]?.id || ('quot-' + Date.now()),
        quotationNo,
        date,
        validUntil,
        status: 'CONVERTED',
        convertedInvoiceNo: assignedInv,
        customerId,
        customerName,
        contactNo,
        email: customerEmail,
        state,
        gstin,
        remarks: `${remarks ? remarks + ' | ' : ''}Converted to Tax Invoice ${assignedInv}`,
        items: cartItems,
        subTotal: Number(sumSubTotal.toFixed(2)),
        cgst: Number(sumCgst.toFixed(2)),
        sgst: Number(sumSgst.toFixed(2)),
        igst: Number(sumIgst.toFixed(2)),
        cess: Number(sumCess.toFixed(2)),
        totalDiscount: cartItems.reduce((acc, it) => acc + it.discAmt, 0),
        roundOff: roundOffVal,
        grandTotal: grandTotal
      };
      onSaveQuotation(updatedQuot);

      showToast(`🎉 Converted to Tax Invoice ${assignedInv}!`);
    } catch (err: any) {
      console.error('Error converting quotation to invoice:', err);
      showToast(`❌ Failed to convert quotation: ${err.message || 'Server error'}`);
    } finally {
      setConverting(false);
    }
  };

  const handleDelete = () => {
    if (quotations[currentIndex] && onDeleteQuotation) {
      if (confirm(`Delete Quotation ${quotationNo}?`)) {
        onDeleteQuotation(quotations[currentIndex].id);
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
      }
    }
  };

  const handleSendWhatsApp = () => {
    if (!contactNo || contactNo.trim().length < 5) {
      showToast('⚠️ Please enter customer contact number first');
      return;
    }
    if (cartItems.length === 0) {
      showToast('⚠️ Please add at least one furniture item to the quotation');
      return;
    }
    const cleanPhone = contactNo.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    let msg = `*SHREE VINAYAKA FURNITURES*\n`;
    msg += `*Official Price Quotation: ${quotationNo}*\n`;
    msg += `📅 Date: ${date} (Valid Until: ${validUntil})\n`;
    msg += `👤 Customer: ${customerName}\n`;
    msg += `--------------------------------\n`;
    msg += `*FURNITURE ITEMS:*\n`;
    cartItems.forEach((it, idx) => {
      msg += `${idx + 1}. *${it.name}*\n   Qty: ${it.qty} ${it.unit || 'PCS'} @ ₹${it.rate.toLocaleString('en-IN')} = ₹${it.total.toLocaleString('en-IN')}\n`;
    });
    msg += `--------------------------------\n`;
    msg += `Taxable Amount: ₹${sumSubTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
    if (sumCgst > 0) msg += `CGST: ₹${sumCgst.toFixed(2)}\n`;
    if (sumSgst > 0) msg += `SGST: ₹${sumSgst.toFixed(2)}\n`;
    if (sumIgst > 0) msg += `IGST: ₹${sumIgst.toFixed(2)}\n`;
    msg += `*GRAND TOTAL: ₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}*\n`;
    msg += `--------------------------------\n`;
    msg += `📍 Showroom: Shree Vinayaka Furnitures, ${companyInfo?.state || defaultShowroomState}\n`;
    msg += `📞 Contact: +91 94484 22354\n`;
    msg += `Thank you for choosing Shree Vinayaka Furnitures!`;

    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    showToast(`📲 Opening WhatsApp to send quotation to ${customerName}...`);
  };

  const handleSendGmail = () => {
    if (cartItems.length === 0) {
      showToast('⚠️ Please add furniture items to quotation');
      return;
    }

    let targetEmail = (customerEmail || '').trim();
    if (!targetEmail) {
      const promptEmail = window.prompt(
        `Enter recipient Email ID for ${customerName} (e.g. customer@gmail.com):`,
        'customer@gmail.com'
      );
      if (promptEmail === null) {
        // User cancelled prompt
        return;
      }
      targetEmail = promptEmail.trim();
      if (targetEmail) {
        setCustomerEmail(targetEmail);
      }
    }

    const subject = `Official Price Quotation ${quotationNo} - Shree Vinayaka Furnitures`;
    let body = `Dear ${customerName},\n\n`;
    body += `Thank you for visiting Shree Vinayaka Furnitures showroom. Please find your official furniture quotation details below:\n\n`;
    body += `Quotation No: ${quotationNo}\n`;
    body += `Date: ${date} (Valid Until: ${validUntil})\n\n`;
    body += `ITEM DETAILS:\n`;
    cartItems.forEach((it, idx) => {
      body += `${idx + 1}. ${it.name} | Qty: ${it.qty} | Rate: Rs.${it.rate.toLocaleString('en-IN')} | Amount: Rs.${it.total.toLocaleString('en-IN')}\n`;
    });
    body += `\nSubtotal: Rs.${sumSubTotal.toFixed(2)}\n`;
    if (sumCgst > 0) body += `CGST: Rs.${sumCgst.toFixed(2)}\n`;
    if (sumSgst > 0) body += `SGST: Rs.${sumSgst.toFixed(2)}\n`;
    if (sumIgst > 0) body += `IGST: Rs.${sumIgst.toFixed(2)}\n`;
    body += `Grand Total: Rs.${grandTotal.toFixed(2)}\n\n`;
    body += `For bookings, delivery schedule, or custom woodwork specifications, please reply to this email or call us at +91 94484 22354.\n\n`;
    body += `Warm Regards,\nShree Vinayaka Furnitures Team\nShowroom: Shree Vinayaka Furnitures, ${companyInfo?.state || defaultShowroomState}\nContact: +91 94484 22354`;

    // Direct Web Gmail Compose URL (instantly opens web Gmail compose in browser)
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    const win = window.open(gmailUrl, '_blank');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    }
    showToast(`✉️ Opening Gmail Compose for ${customerName} (${targetEmail || 'new quotation'})...`);
  };

  // Navigators
  const goFirst = () => setCurrentIndex(0);
  const goPrev = () => setCurrentIndex(Math.max(0, currentIndex - 1));
  const goNext = () => setCurrentIndex(Math.min(quotations.length - 1, currentIndex + 1));
  const goLast = () => setCurrentIndex(Math.max(0, quotations.length - 1));

  const dummyCustomer: Customer = {
    id: customerId,
    name: customerName,
    phone: contactNo,
    email: customerEmail,
    state: state,
    gstin: gstin,
    balance: 0,
    loyaltyPoints: 0,
    address: companyInfo?.address || (companyInfo?.city ? `${companyInfo.city}, ${companyInfo.state || defaultShowroomState}` : defaultShowroomState)
  };

  const quotationTemplateConfig: BillTemplateConfig = {
    paperFormat: 'QUOTATION',
    styleIndex: 1,
    printerName: 'XP-80C (copy 1)',
    upiId: '56149501@ubin',
    showDynamicQr: true
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      flex: 1,
      minHeight: 0,
      background: '#cbd5e1',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      {/* 1. TOP TITLEBAR (Frame 0160) */}
      <div style={{
        background: '#1e3a8a',
        color: '#ffffff',
        padding: '6px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontWeight: 'bold',
        fontSize: '13px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📜</span>
          <span style={{ letterSpacing: '0.5px' }}>QUOTATION</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', cursor: 'pointer' }}>🔔</span>
          <span style={{ fontSize: '13px', cursor: 'pointer' }}>🔊</span>
          <button
            onClick={onClose}
            style={{
              background: '#dc2626',
              color: '#ffffff',
              border: '1px solid #b91c1c',
              padding: '3px 10px',
              borderRadius: '4px',
              fontWeight: '900',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
            title="Exit Quotation [Esc]"
          >
            <span>✕</span>
            <span>EXIT [Esc]</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div
          style={{
            backgroundColor: '#eff6ff',
            color: '#1e40af',
            borderBottom: '1px solid #bfdbfe',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 'bold',
            textAlign: 'center'
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* 2. TOP INFORMATION BOXES & ACTION BUTTONS */}
      <div style={{
        background: '#f8fafc',
        padding: '8px 12px',
        borderBottom: '2px solid #94a3b8',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        fontSize: '11px'
      }}>
        {/* Box A: Quotation Info */}
        <fieldset style={{
          border: '1px solid #94a3b8',
          borderRadius: '3px',
          padding: '6px 8px',
          width: '280px',
          background: '#ffffff'
        }}>
          <legend style={{ fontWeight: 'bold', color: '#1e3a8a', padding: '0 4px' }}>Quotation Info</legend>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
            <span style={{ width: '85px', fontWeight: 'bold' }}>Quotation No. :</span>
            <input
              type="text"
              value={quotationNo}
              onChange={e => setQuotationNo(e.target.value)}
              style={{ flex: 1, padding: '2px 4px', border: '1px solid #94a3b8', fontSize: '11px', fontWeight: 'bold' }}
            />
            {/* Record Navigators (Frame 0160) */}
            <div style={{ display: 'flex', gap: '1px' }}>
              <button onClick={goFirst} title="First" style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '2px 4px', fontSize: '9px', cursor: 'pointer' }}>|&lt;&lt;</button>
              <button onClick={goPrev} title="Previous" style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '2px 4px', fontSize: '9px', cursor: 'pointer' }}>&lt;&lt;</button>
              <button onClick={goNext} title="Next" style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '2px 4px', fontSize: '9px', cursor: 'pointer' }}>&gt;&gt;</button>
              <button onClick={goLast} title="Last" style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '2px 4px', fontSize: '9px', cursor: 'pointer' }}>&gt;&gt;|</button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
            <span style={{ width: '85px', fontWeight: 'bold' }}>Date :</span>
            <input
              type="text"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ width: '85px', padding: '2px 4px', border: '1px solid #94a3b8', fontSize: '11px' }}
            />
            <span style={{ fontWeight: 'bold', marginLeft: '4px', fontSize: '10px' }}>Valid:</span>
            <input
              type="text"
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
              placeholder="DD/MM/YYYY"
              title="Quotation Validity Date (GAP 4 Fix)"
              style={{ width: '85px', padding: '2px 4px', border: '1px solid #94a3b8', fontSize: '11px', background: '#f0fdf4' }}
            />
          </div>

          {quotationStatus === 'CONVERTED' && (
            <div style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#065f46', padding: '2px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
              ✓ Converted to Tax Invoice: {convertedInvoiceNo || 'N/A'}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '85px', fontWeight: 'bold' }}>Remarks :</span>
            <input
              type="text"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              style={{ flex: 1, padding: '2px 4px', background: '#fef9c3', border: '1px solid #94a3b8', fontSize: '11px' }}
            />
          </div>
        </fieldset>

        {/* Box B: Customer Details */}
        <fieldset style={{
          border: '1px solid #94a3b8',
          borderRadius: '3px',
          padding: '6px 8px',
          flex: 1,
          background: '#ffffff'
        }}>
          <legend style={{ fontWeight: 'bold', color: '#1e3a8a', padding: '0 4px' }}>Customer Details</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '85px', fontWeight: 'bold' }}>Customer ID :</span>
              <input
                type="text"
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                style={{ flex: 1, padding: '2px 4px', border: '1px solid #94a3b8', fontSize: '11px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '85px', fontWeight: 'bold' }}>Contact No. : *</span>
              <input
                type="text"
                value={contactNo}
                onChange={e => {
                  setContactNo(e.target.value);
                  const found = customers.find(c => c.phone === e.target.value);
                  if (found) {
                    setCustomerId(found.id);
                    setCustomerName(found.name);
                    if (found.email) setCustomerEmail(found.email);
                    setState((found.state && found.state !== 'Kerala') ? found.state : defaultShowroomState);
                    setGstin(found.gstin || '');
                  }
                }}
                style={{ flex: 1, padding: '2px 4px', background: '#fef9c3', border: '1px solid #94a3b8', fontSize: '11px', fontWeight: 'bold' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '85px', fontWeight: 'bold' }}>Customer Name :</span>
              <input
                type="text"
                value={customerName}
                onChange={e => {
                  const val = e.target.value;
                  setCustomerName(val);
                  const matched = customers.find(c => c.name.toLowerCase() === val.trim().toLowerCase());
                  if (matched) {
                    setCustomerId(matched.id);
                    if (matched.phone) setContactNo(matched.phone);
                    if (matched.email) setCustomerEmail(matched.email);
                    setState((matched.state && matched.state !== 'Kerala') ? matched.state : defaultShowroomState);
                    setGstin(matched.gstin || '');
                  }
                }}
                style={{ flex: 1, padding: '2px 4px', background: '#fef9c3', border: '1px solid #94a3b8', fontSize: '11px', fontWeight: 'bold' }}
              />
              {onOpenCustomerModal && (
                <button
                  type="button"
                  onClick={onOpenCustomerModal}
                  title="Open Customer Directory [F1]"
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: '1px solid #1d4ed8',
                    padding: '2px 6px',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '10px'
                  }}
                >
                  👤 F1
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '85px', fontWeight: 'bold' }}>Email ID :</span>
              <input
                type="email"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder="customer@gmail.com"
                style={{ flex: 1, padding: '2px 4px', border: '1px solid #94a3b8', fontSize: '11px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '85px', fontWeight: 'bold' }}>State :</span>
              <input
                type="text"
                list="quotation-states-list"
                value={state}
                onChange={e => setState(e.target.value)}
                placeholder="e.g. Karnataka"
                style={{ flex: 1, padding: '2px 4px', border: '1px solid #94a3b8', fontSize: '11px', fontWeight: 'bold', background: '#f0fdf4' }}
              />
              <datalist id="quotation-states-list">
                <option value="Karnataka">Karnataka (Code: 29)</option>
                <option value="Kerala">Kerala (Code: 32)</option>
                <option value="Tamil Nadu">Tamil Nadu (Code: 33)</option>
                <option value="Andhra Pradesh">Andhra Pradesh (Code: 37)</option>
                <option value="Telangana">Telangana (Code: 36)</option>
                <option value="Maharashtra">Maharashtra (Code: 27)</option>
                <option value="Goa">Goa (Code: 30)</option>
              </datalist>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '85px', fontWeight: 'bold' }}>GSTIN :</span>
              <input
                type="text"
                value={gstin}
                onChange={e => setGstin(e.target.value)}
                placeholder="GSTIN Number"
                style={{ flex: 1, padding: '2px 4px', border: '1px solid #94a3b8', fontSize: '11px' }}
              />
            </div>
          </div>
        </fieldset>

        {/* Box C: Image Preview Box (Frame 0160) */}
        <div style={{
          width: '90px',
          height: '75px',
          border: '1px solid #94a3b8',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontSize: '9px',
          color: '#64748b'
        }}>
          {selectedProduct?.photo ? (
            <img src={selectedProduct.photo} alt={productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div>
              <div style={{ fontSize: '16px', marginBottom: '2px' }}>🖼️</div>
              <div style={{ fontWeight: 'bold', lineHeight: '1.1' }}>NO IMAGE AVAILABLE</div>
            </div>
          )}
        </div>

        {/* Box D: Action Buttons Grid (Frame 0160) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
            <button
              onClick={handleNew}
              style={{
                background: 'linear-gradient(180deg, #1e40af 0%, #172554 100%)',
                color: '#ffffff',
                border: '1px solid #1e3a8a',
                padding: '4px 2px',
                fontWeight: 'bold',
                fontSize: '11px',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              New
            </button>
            <button
              onClick={handleSave}
              style={{
                background: 'linear-gradient(180deg, #16a34a 0%, #14532d 100%)',
                color: '#ffffff',
                border: '1px solid #15803d',
                padding: '4px 2px',
                fontWeight: 'bold',
                fontSize: '11px',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              Save
            </button>
            <button
              onClick={handleSave}
              style={{
                background: 'linear-gradient(180deg, #334155 0%, #0f172a 100%)',
                color: '#ffffff',
                border: '1px solid #1e293b',
                padding: '4px 2px',
                fontWeight: 'bold',
                fontSize: '11px',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              Update
            </button>
            <button
              onClick={handleDelete}
              style={{
                background: 'linear-gradient(180deg, #64748b 0%, #334155 100%)',
                color: '#ffffff',
                border: '1px solid #475569',
                padding: '4px 2px',
                fontWeight: 'bold',
                fontSize: '11px',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
            <button
              onClick={() => showToast(`Found ${quotations.length} Quotations in database`)}
              style={{
                background: 'linear-gradient(180deg, #2563eb 0%, #1e40af 100%)',
                color: '#ffffff',
                border: '1px solid #1d4ed8',
                padding: '4px 2px',
                fontWeight: 'bold',
                fontSize: '11px',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              Get Data
            </button>
            <button
              onClick={() => setShowPrintModal(true)}
              style={{
                background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
                color: '#ffffff',
                border: '1px solid #0f172a',
                padding: '4px 2px',
                fontWeight: 'bold',
                fontSize: '11px',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              Print
            </button>
          </div>

          {/* Convert to Tax Invoice Button (BUG 3 Fix) */}
          <button
            type="button"
            onClick={handleConvertToInvoice}
            disabled={converting}
            title="Convert this quotation directly into an official Tax Invoice (Deducts stock & creates delivery note)"
            style={{
              marginTop: '4px',
              background: quotationStatus === 'CONVERTED'
                ? 'linear-gradient(180deg, #059669 0%, #065f46 100%)'
                : 'linear-gradient(180deg, #d97706 0%, #b45309 100%)',
              color: '#ffffff',
              border: quotationStatus === 'CONVERTED' ? '1px solid #047857' : '1px solid #92400e',
              padding: '6px 4px',
              fontWeight: '900',
              fontSize: '11px',
              borderRadius: '3px',
              cursor: converting ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            <span>{converting ? '⏳' : (quotationStatus === 'CONVERTED' ? '✓' : '⚡')}</span>
            {converting ? 'Converting...' : (quotationStatus === 'CONVERTED' ? `Converted (Inv #${convertedInvoiceNo || ''})` : 'Convert to Tax Invoice')}
          </button>

          {/* Direct WhatsApp, Gmail & Hardcopy Dispatch */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '4px', marginBottom: '2px' }}>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              title="Send Quotation breakdown directly to customer WhatsApp"
              style={{
                background: 'linear-gradient(180deg, #25D366 0%, #128C7E 100%)',
                color: '#ffffff',
                border: '1px solid #075E54',
                padding: '6px 2px',
                fontWeight: 'bold',
                fontSize: '10.5px',
                borderRadius: '3px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                whiteSpace: 'nowrap'
              }}
            >
              <span>📲</span> WhatsApp
            </button>
            <button
              type="button"
              onClick={handleSendGmail}
              title="Send Quotation details via Gmail / Email client"
              style={{
                background: 'linear-gradient(180deg, #ea4335 0%, #b91c1c 100%)',
                color: '#ffffff',
                border: '1px solid #991b1b',
                padding: '6px 2px',
                fontWeight: 'bold',
                fontSize: '10.5px',
                borderRadius: '3px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                whiteSpace: 'nowrap'
              }}
            >
              <span>✉️</span> Gmail
            </button>
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              title="Official Hardcopy Print & PDF Download"
              style={{
                gridColumn: 'span 2',
                background: 'linear-gradient(180deg, #0f766e 0%, #115e59 100%)',
                color: '#ffffff',
                border: '1px solid #042f2e',
                padding: '6px 2px',
                fontWeight: 'bold',
                fontSize: '11px',
                borderRadius: '3px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                whiteSpace: 'nowrap'
              }}
            >
              <span>🖨️</span> Hardcopy
            </button>
          </div>
          {/* Product Image Show Checkbox */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            border: '1px solid #16a34a',
            padding: '2px 4px',
            background: '#dcfce7',
            fontSize: '9px',
            borderRadius: '2px',
            justifyContent: 'center'
          }}>
            <input
              type="checkbox"
              id="quotProductImageShow"
              checked={showProductImage}
              onChange={e => setShowProductImage(e.target.checked)}
            />
            <label htmlFor="quotProductImageShow" style={{ fontWeight: 'bold', color: '#15803d', cursor: 'pointer' }}>
              Product Image Show
            </label>
          </div>
        </div>
      </div>

      {/* 3. PRODUCT ENTRY STRIP (Frame 0160) */}
      <div style={{
        background: '#ffffff',
        padding: '8px 12px',
        borderBottom: '1px solid #94a3b8',
        fontSize: '11px'
      }}>
        {/* Row 1: HSN, Name, Barcode, Qty, Unit, Price, Disc */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontWeight: 'bold', marginRight: '4px', color: '#0f172a' }}>HSN Code :</span>
            <input
              type="text"
              value={hsnCode}
              onChange={e => setHsnCode(e.target.value)}
              style={{ width: '60px', padding: '2px 4px', border: '1px solid #94a3b8', fontSize: '11px', color: '#0f172a', background: '#ffffff' }}
            />
          </div>

          <div>
            <span style={{ fontWeight: 'bold', marginRight: '4px', color: '#0f172a' }}>Product Name :</span>
            <select
              value={selectedProduct?.id || ''}
              onChange={e => {
                const found = products.find(p => p.id === e.target.value);
                if (found) handleSelectProduct(found);
              }}
              style={{ width: '130px', padding: '2px 4px', background: '#fef9c3', border: '1px solid #94a3b8', fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {onOpenProductModal && (
              <button
                type="button"
                onClick={onOpenProductModal}
                title="Open Product List [F3]"
                style={{
                  background: '#16a34a',
                  color: '#ffffff',
                  border: '1px solid #15803d',
                  padding: '2px 6px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '10px',
                  marginLeft: '4px'
                }}
              >
                📦 F3
              </button>
            )}
          </div>

          <div>
            <span style={{ fontWeight: 'bold', marginRight: '4px', color: '#0f172a' }}>Barcode :</span>
            <input
              type="text"
              value={barcode}
              onChange={e => handleBarcodeChange(e.target.value)}
              style={{ width: '80px', padding: '2px 4px', background: '#fef9c3', border: '1px solid #94a3b8', fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}
            />
          </div>

          <div>
            <span style={{ fontWeight: 'bold', marginRight: '4px', color: '#0f172a' }}>Quantity : *</span>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
              style={{ width: '50px', padding: '2px 4px', background: '#fef9c3', border: '1px solid #94a3b8', fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}
            />
          </div>

          <div>
            <span style={{ fontWeight: 'bold', marginRight: '4px', color: '#0f172a' }}>Unit : *</span>
            <select
              value={unit}
              onChange={e => setUnit(e.target.value)}
              style={{ width: '65px', padding: '2px 4px', background: '#fef9c3', border: '1px solid #94a3b8', fontSize: '11px', color: '#0f172a', fontWeight: 'bold' }}
            >
              <option value="KGS">KGS</option>
              <option value="PCS">PCS</option>
              <option value="NOS">NOS</option>
              <option value="BOX">BOX</option>
              <option value="MTR">MTR</option>
            </select>
          </div>

          <div>
            <span style={{ fontWeight: 'bold', marginRight: '4px', color: '#0f172a' }}>Price/Main Unit * :</span>
            <input
              type="number"
              value={priceMainUnit}
              onChange={e => setPriceMainUnit(Number(e.target.value))}
              style={{ width: '75px', padding: '2px 4px', background: '#fef9c3', border: '1px solid #94a3b8', fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}
            />
          </div>

          <div>
            <span style={{ fontWeight: 'bold', marginRight: '4px', color: '#0f172a' }}>Disc :</span>
            <select
              value={discType}
              onChange={e => setDiscType(e.target.value)}
              style={{ width: '45px', padding: '2px 2px', border: '1px solid #94a3b8', fontSize: '11px', color: '#0f172a', fontWeight: 'bold' }}
            >
              <option value="%">%</option>
              <option value="Amt">Amt</option>
            </select>
          </div>

          <div>
            <span style={{ fontWeight: 'bold', marginRight: '4px', color: '#0f172a' }}>{discType === '%' ? '(%)' : '(Amt)'} :</span>
            <input
              type="number"
              value={discType === '%' ? discPercent : discAmt}
              onChange={e => discType === '%' ? setDiscPercent(Number(e.target.value)) : setDiscAmt(Number(e.target.value))}
              style={{ width: '60px', padding: '2px 4px', background: '#fef9c3', border: '1px solid #94a3b8', fontSize: '11px', color: '#0f172a', fontWeight: 'bold' }}
            />
          </div>

          <div>
            <span style={{ fontWeight: 'bold', marginRight: '4px', color: '#0f172a' }}>Total Disc :</span>
            <span style={{ fontWeight: 'bold', color: '#15803d' }}>{currentDiscAmt.toFixed(2)}</span>
          </div>
        </div>

        {/* Row 2: Tax Breakdowns & Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontWeight: 'bold', marginRight: '4px', color: '#0f172a' }}>Sale Tax Type :</span>
            <select
              value={saleTaxType}
              onChange={e => setSaleTaxType(e.target.value as any)}
              style={{ width: '85px', padding: '2px 4px', border: '1px solid #94a3b8', fontSize: '11px', color: '#0f172a', fontWeight: 'bold' }}
            >
              <option value="Inclusive">Inclusive</option>
              <option value="Exclusive">Exclusive</option>
            </select>
          </div>

          <div>
            <span style={{ fontWeight: 'bold', marginRight: '4px', color: '#0f172a' }}>Taxable Amt :</span>
            <input
              type="text"
              readOnly
              value={stagedTaxable.toFixed(2)}
              style={{ width: '70px', padding: '2px 4px', background: '#f1f5f9', border: '1px solid #94a3b8', fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}
            />
          </div>

          <div>
            <span style={{ fontWeight: 'bold', marginRight: '2px', color: '#0f172a' }}>CGST :</span>
            <input
              type="number"
              value={cgstRate}
              onChange={e => setCgstRate(Number(e.target.value))}
              style={{ width: '40px', padding: '2px 2px', border: '1px solid #94a3b8', fontSize: '11px', color: '#0f172a', fontWeight: 'bold' }}
            />
            <span style={{ color: '#0f172a', fontWeight: 'bold' }}>% ({stagedCgst.toFixed(2)})</span>
          </div>

          <div>
            <span style={{ fontWeight: 'bold', marginRight: '2px', color: '#0f172a' }}>SGST :</span>
            <input
              type="number"
              value={sgstRate}
              onChange={e => setSgstRate(Number(e.target.value))}
              style={{ width: '40px', padding: '2px 2px', border: '1px solid #94a3b8', fontSize: '11px', color: '#0f172a', fontWeight: 'bold' }}
            />
            <span style={{ color: '#0f172a', fontWeight: 'bold' }}>% ({stagedSgst.toFixed(2)})</span>
          </div>

          <div>
            <span style={{ fontWeight: 'bold', marginRight: '2px', color: '#0f172a' }}>IGST :</span>
            <input
              type="number"
              value={igstRate}
              onChange={e => setIgstRate(Number(e.target.value))}
              style={{ width: '40px', padding: '2px 2px', border: '1px solid #94a3b8', fontSize: '11px', color: '#0f172a', fontWeight: 'bold' }}
            />
            <span style={{ color: '#0f172a', fontWeight: 'bold' }}>%</span>
          </div>

          <div>
            <span style={{ fontWeight: 'bold', marginRight: '4px', color: '#0f172a' }}>Total Amount :</span>
            <input
              type="text"
              readOnly
              value={effectiveTotal.toFixed(2)}
              style={{ width: '75px', padding: '2px 4px', background: '#fef9c3', border: '1px solid #94a3b8', fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}
            />
          </div>

          {/* Pricing Mode Radio */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="quotPriceMode"
                checked={priceType === 'RETAIL'}
                onChange={() => {
                  setPriceType('RETAIL');
                  if (selectedProduct) setPriceMainUnit(selectedProduct.retailPrice);
                }}
              />
              Retail
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="quotPriceMode"
                checked={priceType === 'WHOLESALE'}
                onChange={() => {
                  setPriceType('WHOLESALE');
                  if (selectedProduct) setPriceMainUnit(selectedProduct.wholesalePrice || selectedProduct.retailPrice);
                }}
              />
              Wholesale
            </label>
          </div>

          {/* Action buttons (Frame 0160) */}
          <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
            <button
              onClick={() => {
                setQuantity(1);
                setDiscPercent(0);
                setDiscAmt(0);
              }}
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              🔄 Reset
            </button>
            <button
              onClick={handleAddToCart}
              style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '3px 12px', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ➕ Add To Cart
            </button>
          </div>
        </div>
      </div>

      {/* 4. CART TABLE (Frame 0160) */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff', borderBottom: '1px solid #94a3b8' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ background: '#1e3a8a', color: '#ffffff', textAlign: 'left', position: 'sticky', top: 0 }}>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #3b82f6' }}>HSN Code</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #3b82f6' }}>Product Name</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #3b82f6' }}>Barcode</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #3b82f6', textAlign: 'center' }}>Qty.</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #3b82f6', textAlign: 'right' }}>Price / Main Unit</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #3b82f6', textAlign: 'right' }}>Discount %</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #3b82f6', textAlign: 'right' }}>Discount</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #3b82f6', textAlign: 'right' }}>CGST %</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #3b82f6', textAlign: 'right' }}>CGST Amt</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #3b82f6', textAlign: 'right' }}>SGST %</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #3b82f6', textAlign: 'right' }}>SGST Amt</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #3b82f6', textAlign: 'right' }}>IGST %</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #3b82f6', textAlign: 'right' }}>Total</th>
              <th style={{ padding: '6px 8px', textAlign: 'center', width: '30px' }}>✕</th>
            </tr>
          </thead>
          <tbody>
            {cartItems.length === 0 ? (
              <tr>
                <td colSpan={14} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                  No items in quotation. Select product and click "Add To Cart".
                </td>
              </tr>
            ) : (
              cartItems.map((item, idx) => (
                <tr
                  key={item.id}
                  style={{
                    background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    borderBottom: '1px solid #e2e8f0'
                  }}
                >
                  <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>{item.hsn || '0'}</td>
                  <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {showProductImage && (
                        <div style={{ width: '24px', height: '24px', border: '1px solid #cbd5e1', overflow: 'hidden', flexShrink: 0 }}>
                          {item.photo ? (
                            <img src={item.photo} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>📦</div>
                          )}
                        </div>
                      )}
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>{item.barcode}</td>
                  <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold' }}>{item.qty} {item.unit}</td>
                  <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'right' }}>{item.rate.toFixed(2)}</td>
                  <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'right' }}>{item.discPercent}%</td>
                  <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'right' }}>{item.discAmt.toFixed(2)}</td>
                  <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'right' }}>{item.cgstPercent}%</td>
                  <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'right' }}>{item.cgstAmt.toFixed(2)}</td>
                  <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'right' }}>{item.sgstPercent}%</td>
                  <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'right' }}>{item.sgstAmt.toFixed(2)}</td>
                  <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'right' }}>{item.igstPercent}%</td>
                  <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold', color: '#1e3a8a' }}>{item.total.toFixed(2)}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '2px', cursor: 'pointer', padding: '1px 5px', fontSize: '10px' }}
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

      {/* 5. BOTTOM SUMMARY BAR (Frame 0160) */}
      <div style={{
        flexShrink: 0,
        background: '#f1f5f9',
        padding: '8px 16px',
        borderTop: '2px solid #cbd5e1',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: 'bold' }}>Items : </span>
            <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>{cartItems.length}</span>
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Total Qty : </span>
            <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>{cartItems.reduce((acc, it) => acc + it.qty, 0)}</span>
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Taxable Amt : </span>
            <span>₹ {sumSubTotal.toFixed(2)}</span>
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>CGST : </span>
            <span>₹ {sumCgst.toFixed(2)}</span>
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>SGST : </span>
            <span>₹ {sumSgst.toFixed(2)}</span>
          </div>
        </div>

        {/* Grand Totals Box (Frame 0160 Bottom Right) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontWeight: 'bold' }}>IGST :</span>
            <input
              type="text"
              readOnly
              value={sumIgst.toFixed(2)}
              style={{ width: '60px', padding: '2px 4px', background: '#e2e8f0', border: '1px solid #94a3b8', fontSize: '11px', textAlign: 'right' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontWeight: 'bold' }}>CESS :</span>
            <input
              type="text"
              readOnly
              value={sumCess.toFixed(2)}
              style={{ width: '60px', padding: '2px 4px', background: '#e2e8f0', border: '1px solid #94a3b8', fontSize: '11px', textAlign: 'right' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontWeight: 'bold' }}>Total :</span>
            <input
              type="text"
              readOnly
              value={rawTotal.toFixed(2)}
              style={{ width: '75px', padding: '2px 4px', background: '#e2e8f0', border: '1px solid #94a3b8', fontSize: '11px', textAlign: 'right', fontWeight: 'bold' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 'bold', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={roundOffChecked}
                onChange={e => setRoundOffChecked(e.target.checked)}
              />
              Round Off :
            </label>
            <input
              type="text"
              readOnly
              value={roundOffVal.toFixed(2)}
              style={{ width: '50px', padding: '2px 4px', background: '#e2e8f0', border: '1px solid #94a3b8', fontSize: '11px', textAlign: 'right' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontWeight: 'bold', color: '#16a34a', fontSize: '12px' }}>Grand Total :</span>
            <input
              type="text"
              readOnly
              value={grandTotal.toFixed(2)}
              style={{
                width: '95px',
                padding: '4px 6px',
                background: '#dcfce7',
                border: '1px solid #16a34a',
                fontSize: '13px',
                textAlign: 'right',
                fontWeight: '900',
                color: '#15803d'
              }}
            />
          </div>
        </div>
      </div>

      {/* 6. QUOTATION PRINT PREVIEW MODAL (Frame 0165) */}
      {showPrintModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 10001,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '960px',
            maxHeight: '92vh',
            background: '#ffffff',
            borderRadius: '4px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#1e3a8a',
              color: '#ffffff',
              padding: '6px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 'bold'
            }}>
              <span>🖨️ Print Preview - Quotation Format</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      showToast(`📄 Downloading Quotation PDF for ${quotationNo}...`);
                      await api.downloadQuotationPdf(quotationNo);
                      showToast(`✓ Quotation PDF downloaded`);
                    } catch (e: any) {
                      showToast(`Quotation PDF: ${e.message}. Using browser print.`);
                      window.print();
                    }
                  }}
                  style={{ background: '#d97706', color: '#fff', border: 'none', padding: '3px 12px', cursor: 'pointer', fontWeight: 'bold', borderRadius: '3px', fontSize: '12px' }}
                >
                  📄 Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '3px 12px', cursor: 'pointer', fontWeight: 'bold', borderRadius: '3px', fontSize: '12px' }}
                >
                  🖨️ Print Now
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '3px 10px', cursor: 'pointer', fontWeight: 'bold', borderRadius: '3px', fontSize: '12px' }}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              <BillTemplatePreview
                companyInfo={companyInfo}
                config={quotationTemplateConfig}
                billData={{
                  invoiceNo: quotationNo,
                  date,
                  dueDate: validUntil,
                  customer: dummyCustomer,
                  items: cartItems,
                  totalQty: cartItems.reduce((acc, it) => acc + it.qty, 0),
                  totalTax: sumCgst + sumSgst + sumIgst + sumCess,
                  totalDisc: cartItems.reduce((acc, it) => acc + it.discAmt, 0),
                  totalMrp: rawTotal,
                  netPay: grandTotal,
                  taxScheme: 'GST'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
