/**
 * Hardware Scanner Service for Desktop Barcode Scanners (e.g. BRONTIX USB Presentation Scanner)
 * 
 * Desktop barcode scanners operate as USB HID keyboards, typing high-speed key sequences
 * (typically 5-30ms per character) followed by an 'Enter' key.
 * This service automatically differentiates between human typing and hardware scanner input,
 * plays a clean retail POS audio beep, and dispatches the scanned barcode to active subscribers.
 */

import { getSystemSetting, saveSystemSetting } from '../api/client';

export interface ScanEventDetail {
  barcode: string;
  durationMs: number;
  charCount: number;
  averageCharIntervalMs: number;
  timestamp: number;
}

export type ScanSubscriber = (detail: ScanEventDetail) => void;

class HardwareScannerService {
  private buffer: string = '';
  private timestamps: number[] = [];
  private subscribers: Set<ScanSubscriber> = new Set();
  private isListening: boolean = false;
  private soundEnabled: boolean = true;
  private maxCharIntervalMs: number = 60; // Max ms between chars for hardware scanner
  private minBarcodeLength: number = 3;
  private lastScanDetail: ScanEventDetail | null = null;
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.loadSettings();
  }

  private async loadSettings() {
    try {
      const data = await getSystemSetting('hardware_scanner');
      if (data && data.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        if (typeof parsed.soundEnabled === 'boolean') this.soundEnabled = parsed.soundEnabled;
        if (typeof parsed.maxCharIntervalMs === 'number') this.maxCharIntervalMs = parsed.maxCharIntervalMs;
        if (typeof parsed.minBarcodeLength === 'number') this.minBarcodeLength = parsed.minBarcodeLength;
      }
    } catch {
      // Backend setting fallback
    }
  }

  public async saveSettings(settings: { soundEnabled?: boolean; maxCharIntervalMs?: number; minBarcodeLength?: number }) {
    if (settings.soundEnabled !== undefined) this.soundEnabled = settings.soundEnabled;
    if (settings.maxCharIntervalMs !== undefined) this.maxCharIntervalMs = settings.maxCharIntervalMs;
    if (settings.minBarcodeLength !== undefined) this.minBarcodeLength = settings.minBarcodeLength;

    try {
      await saveSystemSetting('hardware_scanner', {
        soundEnabled: this.soundEnabled,
        maxCharIntervalMs: this.maxCharIntervalMs,
        minBarcodeLength: this.minBarcodeLength
      });
    } catch (e) {
      console.warn('Failed to save hardware scanner settings to PostgreSQL:', e);
    }
  }

  public getSettings() {
    return {
      soundEnabled: this.soundEnabled,
      maxCharIntervalMs: this.maxCharIntervalMs,
      minBarcodeLength: this.minBarcodeLength
    };
  }

  public getLastScan(): ScanEventDetail | null {
    return this.lastScanDetail;
  }

  /**
   * Play crystal-clear high-pitched POS barcode scanner confirmation beep
   */
  public playScannerBeep(frequency = 2100, durationSec = 0.08) {
    if (!this.soundEnabled) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      if (!this.audioCtx || this.audioCtx.state === 'suspended') {
        this.audioCtx = new AudioCtxClass();
      }
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationSec);
    } catch {
      // Audio context restricted by browser autoplay policy until first click
    }
  }

  /**
   * Subscribe a component (e.g. POS view, Inventory audit, or Hardware Monitor)
   */
  public subscribe(callback: ScanSubscriber): () => void {
    this.subscribers.add(callback);
    this.startGlobalListener();
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Manually simulate or inject a scan (e.g. from test tool or camera)
   */
  public emitScan(barcode: string) {
    const clean = barcode.trim();
    if (!clean) return;

    const detail: ScanEventDetail = {
      barcode: clean,
      durationMs: 25,
      charCount: clean.length,
      averageCharIntervalMs: 2.5,
      timestamp: Date.now()
    };

    this.lastScanDetail = detail;
    this.playScannerBeep();

    this.subscribers.forEach(sub => {
      try {
        sub(detail);
      } catch (err) {
        console.error('Error in scanner subscriber:', err);
      }
    });

    // Dispatch global CustomEvent for any decoupled listener
    window.dispatchEvent(new CustomEvent('svf:barcode-scanned', { detail }));
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // If modifier keys like Ctrl / Alt / Meta are held, ignore
    if (e.ctrlKey || e.altKey || e.metaKey) {
      this.clearBuffer();
      return;
    }

    const now = Date.now();

    // End of scan detection: 'Enter' key
    if (e.key === 'Enter') {
      if (this.buffer.length >= this.minBarcodeLength && this.timestamps.length >= 2) {
        const totalDuration = now - this.timestamps[0];
        const avgInterval = totalDuration / (this.timestamps.length - 1);

        // Hardware scanners typically transmit entire barcodes in under 120ms (avg < 50ms per key)
        const isFromHardwareScanner = avgInterval <= this.maxCharIntervalMs;

        if (isFromHardwareScanner) {
          // Hardware scan confirmed!
          e.preventDefault();
          e.stopPropagation();

          const detail: ScanEventDetail = {
            barcode: this.buffer,
            durationMs: totalDuration,
            charCount: this.buffer.length,
            averageCharIntervalMs: Number(avgInterval.toFixed(1)),
            timestamp: now
          };

          this.lastScanDetail = detail;
          this.playScannerBeep();

          // Notify all subscribers
          this.subscribers.forEach(sub => {
            try {
              sub(detail);
            } catch (err) {
              console.error('Scanner subscriber error:', err);
            }
          });

          window.dispatchEvent(new CustomEvent('svf:barcode-scanned', { detail }));
          this.clearBuffer();
          return;
        }
      }
      this.clearBuffer();
      return;
    }

    // Only collect single printable characters
    if (e.key.length === 1) {
      // Check interval since last key. If too long, reset buffer (user is typing manually)
      if (this.timestamps.length > 0) {
        const lastTimestamp = this.timestamps[this.timestamps.length - 1];
        if (now - lastTimestamp > this.maxCharIntervalMs * 3) {
          this.clearBuffer();
        }
      }

      this.buffer += e.key;
      this.timestamps.push(now);

      // Prevent buffer from growing unbounded
      if (this.buffer.length > 120) {
        this.clearBuffer();
      }
    }
  };

  private clearBuffer() {
    this.buffer = '';
    this.timestamps = [];
  }

  public startGlobalListener() {
    if (this.isListening || typeof window === 'undefined') return;
    window.addEventListener('keydown', this.handleKeyDown, true);
    this.isListening = true;
  }

  public stopGlobalListener() {
    if (!this.isListening || typeof window === 'undefined') return;
    window.removeEventListener('keydown', this.handleKeyDown, true);
    this.isListening = false;
  }
}

export const hardwareScanner = new HardwareScannerService();
