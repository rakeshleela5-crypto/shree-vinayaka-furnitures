import { getSystemSetting, saveSystemSetting } from '../api/client';

/**
 * Dynamic QR Code Display (DQR) Service
 * Hardware integration for Customer-Facing DQR Stands (IndiaMART ID: 2858609017388 / Eventum / Sunmi / Pole Display)
 * Supports:
 *  1. Cross-window BroadcastChannel + localStorage real-time dual-screen customer display sync
 *  2. Web Serial API (navigator.serial) USB Virtual COM Port communication for physical DQR Stands
 *  3. Dynamic BHIM UPI QR Code generation (GPay, PhonePe, Paytm, BHIM, Cred, Any UPI)
 *  4. Multilingual Soundbox Voice Announcement (Web Speech API) & Audio Chime
 */

export type DqrPaymentState = 'IDLE' | 'BILLING' | 'PAYING' | 'PAID';

export interface DqrBillItem {
  id?: string;
  name: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface DqrPayload {
  storeName: string;
  storeUpiId: string;
  billNo: string;
  customerName: string;
  customerPhone?: string;
  items: DqrBillItem[];
  subtotal: number;
  discount: number;
  tax: number;
  netPay: number;
  upiUri: string;
  state: DqrPaymentState;
  utr?: string;
  timestamp: number;
  paymentMode?: string;
}

export interface DqrSerialLog {
  id: string;
  timestamp: string;
  type: 'INFO' | 'TX' | 'RX' | 'ERROR' | 'SUCCESS';
  message: string;
}

export type DqrListener = (payload: DqrPayload) => void;
export type DqrSerialLogListener = (logs: DqrSerialLog[]) => void;

const BROADCAST_CHANNEL_NAME = 'svf_dynamic_qr_display_bus';
const LOCAL_STORAGE_KEY = 'svf_active_dqr_payload';

export interface DqrHardwareSettings {
  autoConnectUsb: boolean;
  baudRate: number;
  deviceProtocol: 'EVENTUM_JSON' | 'ESCPOS_POLE' | 'RAW_TEXT';
  soundboxVoiceEnabled: boolean;
  voiceLanguage: 'en-IN' | 'hi-IN' | 'te-IN' | 'kn-IN';
  voiceVolume: number;
  voiceRate: number;
  defaultUpiId: string;
  merchantName: string;
}

const DEFAULT_SETTINGS: DqrHardwareSettings = {
  autoConnectUsb: false,
  baudRate: 115200,
  deviceProtocol: 'EVENTUM_JSON',
  soundboxVoiceEnabled: true,
  voiceLanguage: 'en-IN',
  voiceVolume: 1.0,
  voiceRate: 0.95,
  defaultUpiId: 'shreevinayaka@icici',
  merchantName: 'SHREE VINAYAKA FURNITURES'
};

class DynamicQrDisplayService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<DqrListener> = new Set();
  private serialLogListeners: Set<DqrSerialLogListener> = new Set();
  private logs: DqrSerialLog[] = [];
  private currentPayload: DqrPayload;
  private settings: DqrHardwareSettings;

  // Web Serial API port handle
  private serialPort: any = null;
  private serialWriter: any = null;
  private isConnectingSerial = false;

  constructor() {
    this.settings = this.loadSettings();

    this.currentPayload = {
      storeName: this.settings.merchantName,
      storeUpiId: this.settings.defaultUpiId,
      billNo: 'WELCOME',
      customerName: 'Valued Customer',
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      netPay: 0,
      upiUri: `upi://pay?pa=${this.settings.defaultUpiId}&pn=${encodeURIComponent(this.settings.merchantName)}&cu=INR`,
      state: 'IDLE',
      timestamp: Date.now()
    };

    this.initCrossWindowSync();
    this.syncSettingsFromBackend();
    this.addLog('INFO', 'DQR Customer Display Service Initialized');
  }

  private initCrossWindowSync() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.storeName) {
            this.currentPayload = parsed;
          }
        }
      } catch {}

      if ('BroadcastChannel' in window) {
        try {
          this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
          this.channel.onmessage = (event) => {
            if (event.data && event.data.type === 'DQR_UPDATE') {
              this.currentPayload = event.data.payload;
              this.notifyListeners();
            }
          };
        } catch (e) {
          console.warn('[DQR] BroadcastChannel init error:', e);
        }
      }

      window.addEventListener('storage', (e) => {
        if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
          try {
            this.currentPayload = JSON.parse(e.newValue);
            this.notifyListeners();
          } catch {}
        }
      });
    }
  }

  public async syncSettingsFromBackend() {
    try {
      const data = await getSystemSetting('dqr_hardware');
      if (data && data.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        this.settings = { ...DEFAULT_SETTINGS, ...parsed };
        this.notifyListeners();
      }
    } catch {}
  }

  // Settings
  public loadSettings(): DqrHardwareSettings {
    return DEFAULT_SETTINGS;
  }

  public async saveSettings(newSettings: Partial<DqrHardwareSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      await saveSystemSetting('dqr_hardware', this.settings);
    } catch (e) {
      console.warn('Failed to save DQR hardware settings to PostgreSQL:', e);
    }
    this.addLog('INFO', `Settings updated: Baud=${this.settings.baudRate}, Protocol=${this.settings.deviceProtocol}, Voice=${this.settings.soundboxVoiceEnabled}`);
  }

  public getSettings(): DqrHardwareSettings {
    return { ...this.settings };
  }

  public getCurrentPayload(): DqrPayload {
    return { ...this.currentPayload };
  }

  public subscribe(listener: DqrListener): () => void {
    this.listeners.add(listener);
    listener(this.currentPayload);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeLogs(listener: DqrSerialLogListener): () => void {
    this.serialLogListeners.add(listener);
    listener([...this.logs]);
    return () => {
      this.serialLogListeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => {
      try {
        fn(this.currentPayload);
      } catch (err) {
        console.error('[DQR] Listener callback failed:', err);
      }
    });
  }

  private notifyLogListeners() {
    this.serialLogListeners.forEach((fn) => {
      try {
        fn([...this.logs]);
      } catch {}
    });
  }

  public addLog(type: DqrSerialLog['type'], message: string) {
    const newLog: DqrSerialLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      message
    };
    this.logs = [newLog, ...this.logs.slice(0, 49)];
    this.notifyLogListeners();
  }

  // Publish state update to all screens & physical device
  public broadcastPayload(updates: Partial<DqrPayload>) {
    const net = updates.netPay !== undefined ? updates.netPay : this.currentPayload.netPay;
    const bill = updates.billNo !== undefined ? updates.billNo : this.currentPayload.billNo;
    const upiId = updates.storeUpiId || this.settings.defaultUpiId;
    const pName = updates.storeName || this.settings.merchantName;

    const tr = bill && bill !== 'WELCOME' ? `&tr=${encodeURIComponent(bill)}` : '';
    const tn = bill && bill !== 'WELCOME' ? `&tn=${encodeURIComponent(`Bill ${bill} - Shree Vinayaka Furnitures`)}` : '&tn=Furniture%20Purchase';
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(pName)}&am=${net > 0 ? net.toFixed(2) : '0.00'}&cu=INR${tr}${tn}`;

    this.currentPayload = {
      ...this.currentPayload,
      ...updates,
      netPay: net,
      upiUri: updates.upiUri || upiUri,
      timestamp: Date.now()
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.currentPayload));
      } catch {}

      if (this.channel) {
        try {
          this.channel.postMessage({
            type: 'DQR_UPDATE',
            payload: this.currentPayload
          });
        } catch {}
      }
    }

    this.notifyListeners();

    // Send to physical USB DQR Stand if connected
    this.sendToHardwareDevice(this.currentPayload);

    // If transitioned to PAID, speak voice confirmation
    if (updates.state === 'PAID') {
      this.playPaymentSuccessChime();
      if (this.settings.soundboxVoiceEnabled && this.currentPayload.netPay > 0) {
        this.speakPaymentSuccess(this.currentPayload.netPay, this.currentPayload.utr);
      }
    }
  }

  // Quick helper: Set POS Billing mode
  public setBillingState(items: DqrBillItem[], billNo: string, customerName = 'Valued Customer', discount = 0, tax = 0) {
    const subtotal = items.reduce((acc, it) => acc + (it.amount || it.qty * it.rate), 0);
    const netPay = Math.max(0, subtotal - discount + tax);
    this.broadcastPayload({
      state: items.length > 0 ? 'BILLING' : 'IDLE',
      items,
      billNo: billNo || 'ACTIVE-BILL',
      customerName: customerName || 'Valued Customer',
      subtotal,
      discount,
      tax,
      netPay
    });
  }

  // Quick helper: Set Paying mode with dynamic QR code
  public setPaymentPrompt(netPay: number, billNo: string, customerName = 'Valued Customer') {
    this.broadcastPayload({
      state: 'PAYING',
      billNo,
      customerName,
      netPay
    });
    this.addLog('INFO', `Sent DQR Payment Prompt for ₹${netPay.toFixed(2)} (Bill: ${billNo})`);
  }

  // Quick helper: Confirm Paid
  public setPaymentSuccess(utr?: string, paymentMode = 'UPI') {
    this.broadcastPayload({
      state: 'PAID',
      utr: utr || `UPI${Date.now().toString().slice(-8)}`,
      paymentMode
    });
    this.addLog('SUCCESS', `Payment Confirmed! Amount: ₹${this.currentPayload.netPay.toFixed(2)} [UTR: ${utr || 'CONFIRMED'}]`);
  }

  // Reset to Idle Showroom Welcome Screen
  public resetToIdle() {
    this.broadcastPayload({
      state: 'IDLE',
      billNo: 'WELCOME',
      customerName: 'Valued Customer',
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      netPay: 0,
      utr: undefined
    });
    this.addLog('INFO', 'DQR Screen reset to Showroom Idle Welcome');
  }

  // Open secondary window on customer monitor or tablet
  public openCustomerDisplayWindow(): Window | null {
    if (typeof window === 'undefined') return null;
    const url = `${window.location.origin}/?mode=customer-display`;
    const w = 1024;
    const h = 768;
    const left = window.screen.width > 1920 ? 1920 : (window.screen.width - w) / 2;
    const top = 50;
    const win = window.open(
      url,
      'SvfCustomerDisplayWindow',
      `width=${w},height=${h},top=${top},left=${left},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
    );
    if (win) {
      this.addLog('SUCCESS', 'Launched customer-facing Dynamic QR display window');
      // Re-broadcast current state to new window
      setTimeout(() => {
        this.broadcastPayload({});
      }, 500);
    } else {
      this.addLog('ERROR', 'Pop-up blocked. Please allow pop-ups for this site.');
    }
    return win;
  }

  // =========================================================================
  // WEB SERIAL HARDWARE INTEGRATION (Eventum DQR Stand / USB Pole Display)
  // =========================================================================

  public isWebSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public isSerialConnected(): boolean {
    return Boolean(this.serialPort && this.serialWriter);
  }

  public async connectSerialPort(): Promise<boolean> {
    if (!this.isWebSerialSupported()) {
      this.addLog('ERROR', 'Web Serial API not supported in this browser. Please use Google Chrome or Microsoft Edge on Windows.');
      return false;
    }

    if (this.isConnectingSerial) return false;
    this.isConnectingSerial = true;

    try {
      this.addLog('INFO', `Requesting USB COM port for Dynamic QR Display Stand at ${this.settings.baudRate} baud...`);
      // User picks the USB Virtual COM port (e.g. CH340 / CP2102 / STM32 USB Serial)
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: this.settings.baudRate });

      this.serialPort = port;
      const textEncoder = new TextEncoderStream();
      textEncoder.readable.pipeTo(port.writable);
      this.serialWriter = textEncoder.writable.getWriter();

      this.addLog('SUCCESS', `Connected to DQR Hardware Stand on USB COM Port (${this.settings.baudRate} bps)!`);

      // Send initial handshake / clear screen
      await this.sendToHardwareDevice(this.currentPayload);
      this.isConnectingSerial = false;
      return true;
    } catch (err: any) {
      this.isConnectingSerial = false;
      if (err.name === 'NotFoundError') {
        this.addLog('INFO', 'Port selection cancelled by user');
      } else {
        this.addLog('ERROR', `Failed to open Serial port: ${err.message || err}`);
      }
      return false;
    }
  }

  public async disconnectSerialPort() {
    try {
      if (this.serialWriter) {
        await this.serialWriter.close();
        this.serialWriter = null;
      }
      if (this.serialPort) {
        await this.serialPort.close();
        this.serialPort = null;
      }
      this.addLog('INFO', 'Disconnected from USB DQR Hardware Stand');
    } catch (err: any) {
      this.addLog('ERROR', `Error disconnecting port: ${err.message || err}`);
    }
  }

  private async sendToHardwareDevice(payload: DqrPayload) {
    if (!this.serialWriter) return;

    try {
      let dataString = '';
      if (this.settings.deviceProtocol === 'EVENTUM_JSON') {
        // Eventum / Standard Android/MCU DQR Display Stand JSON packet
        const packet = {
          device: 'DQR-SVF',
          cmd: payload.state === 'IDLE' ? 'IDLE' : payload.state === 'PAID' ? 'SUCCESS' : 'SHOW_QR',
          store: payload.storeName,
          bill_no: payload.billNo,
          customer: payload.customerName,
          amount: payload.netPay,
          upi_url: payload.upiUri,
          status: payload.state,
          utr: payload.utr || '',
          timestamp: payload.timestamp
        };
        dataString = JSON.stringify(packet) + '\r\n';
      } else if (this.settings.deviceProtocol === 'ESCPOS_POLE') {
        // Standard 2-Line Customer Pole Display (ESC/POS)
        // Line 1: Store / Bill
        // Line 2: Amount / Status
        const line1 = payload.state === 'PAID'
          ? 'PAID THANK YOU!'
          : payload.state === 'PAYING'
          ? `PAY: Rs.${payload.netPay.toFixed(2)}`
          : payload.storeName.substring(0, 20);
        const line2 = payload.state === 'PAID'
          ? `UTR:${payload.utr?.substring(0, 16) || 'CONFIRMED'}`
          : payload.state === 'PAYING'
          ? 'SCAN UPI QR CODE'
          : `BILL:${payload.billNo.substring(0, 15)}`;
        // ESC @ (Clear) + Line 1 + Line 2
        dataString = `\x1B\x40${line1.padEnd(20, ' ')}${line2.padEnd(20, ' ')}\r\n`;
      } else {
        // Raw text
        dataString = `SVF_DQR|${payload.state}|${payload.billNo}|${payload.netPay.toFixed(2)}|${payload.upiUri}\r\n`;
      }

      await this.serialWriter.write(dataString);
      this.addLog('TX', `Sent ${dataString.length} bytes to DQR Stand (${payload.state} state: ₹${payload.netPay.toFixed(2)})`);
    } catch (err: any) {
      this.addLog('ERROR', `USB Write error: ${err.message || err}`);
    }
  }

  // =========================================================================
  // SOUNDBOX VOICE ALERT & AUDIO CHIME (Paytm / PhonePe Soundbox style)
  // =========================================================================

  public playPaymentSuccessChime() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Two-tone payment success chime (C6 -> E6 -> G6 major arpeggio)
      const now = ctx.currentTime;
      const playTone = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.3, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      };

      playTone(523.25, now, 0.15); // C5
      playTone(659.25, now + 0.1, 0.15); // E5
      playTone(783.99, now + 0.2, 0.18); // G5
      playTone(1046.50, now + 0.32, 0.45); // C6
    } catch (e) {
      console.warn('[DQR] AudioContext chime error:', e);
    }
  }

  public speakPaymentSuccess(amount: number, _utr?: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const roundedAmt = Math.round(amount);
      let textToSpeak = '';

      switch (this.settings.voiceLanguage) {
        case 'hi-IN':
          textToSpeak = `श्री विनायका फर्नीचर्स: यूपीआई पर ${roundedAmt} रुपये प्राप्त हुए। धन्यवाद।`;
          break;
        case 'te-IN':
          textToSpeak = `శ్రీ వినాయక ఫర్నిచర్స్: యూపీఐ ద్వారా ${roundedAmt} రూపాయలు అందాయి. ధన్యవాదాలు.`;
          break;
        case 'kn-IN':
          textToSpeak = `ಶ್ರೀ ವಿನಾಯಕ ಫರ್ನಿಚರ್ಸ್: ಯುಪಿಐ ಮೂಲಕ ${roundedAmt} ರೂಪಾಯಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ಧನ್ಯವಾದಗಳು.`;
          break;
        case 'en-IN':
        default:
          textToSpeak = `Shree Vinayaka Furnitures: Received rupees ${roundedAmt.toLocaleString('en-IN')} on UPI. Thank you.`;
          break;
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = this.settings.voiceLanguage;
      utterance.rate = this.settings.voiceRate;
      utterance.volume = this.settings.voiceVolume;

      // Pick Indian voice if available
      const voices = window.speechSynthesis.getVoices();
      const inVoice = voices.find(v => v.lang === this.settings.voiceLanguage || v.lang.startsWith(this.settings.voiceLanguage.split('-')[0]));
      if (inVoice) {
        utterance.voice = inVoice;
      }

      window.speechSynthesis.speak(utterance);
      this.addLog('SUCCESS', `🔊 Soundbox Voice Alert: "${textToSpeak}"`);
    } catch (e: any) {
      console.warn('[DQR] SpeechSynthesis error:', e);
    }
  }

  public testVoiceSoundbox(amount = 45500) {
    this.playPaymentSuccessChime();
    this.speakPaymentSuccess(amount, 'TEST-UTR-12345');
  }
}

export const dynamicQrService = new DynamicQrDisplayService();
