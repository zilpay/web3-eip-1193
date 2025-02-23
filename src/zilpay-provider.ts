import type { RequestPayload, ZilPayProvider } from './types';

export class ZilPayProviderImpl implements ZilPayProvider {
  readonly isZilPay: boolean = true;
  #eventListeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  constructor() {
    this.#initializeEvents();
    if (typeof window !== 'undefined' && window) {
      window.addEventListener('message', this._handleFlutterEvents.bind(this));
    }
  }

  #initializeEvents() {
    this.#eventListeners.set('connect', new Set());
    this.#eventListeners.set('disconnect', new Set());
    this.#eventListeners.set('chainChanged', new Set());
    this.#eventListeners.set('accountsChanged', new Set());
    this.#eventListeners.set('message', new Set());
  }

  async request(payload: RequestPayload): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).substring(2);
      const message = {
        type: 'ZILPAY_REQUEST',
        requestId,
        payload
      };

      if (typeof window !== 'undefined' && window) {
        window.postMessage(message, '*');
      }

      const handler = (event: MessageEvent) => {
        if (event.data.type === 'ZILPAY_RESPONSE' && event.data.requestId === requestId) {
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
          if (typeof window !== 'undefined' && window) {
            window.removeEventListener('message', handler);
          }
        }
      };

      if (typeof window !== 'undefined' && window) {
        window.addEventListener('message', handler);
      }
    });
  }

  async enable(): Promise<string[]> {
    return this.request({ method: 'requestAccounts' });
  }

  on(event: string, callback: (...args: any[]) => void): void {
    const listeners = this.#eventListeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }
  }

  removeListener(event: string, callback: (...args: any[]) => void): void {
    const listeners = this.#eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  _handleFlutterEvents(event: MessageEvent) {
    if (event.data.type === 'ZILPAY_EVENT') {
      const listeners = this.#eventListeners.get(event.data.event);
      if (listeners) {
        listeners.forEach(callback => callback(event.data.data));
      }
    }
  }
}
