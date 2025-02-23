import type { RequestPayload, ZilPayProvider } from './types';

export class ZilPayProviderImpl implements ZilPayProvider {
  readonly isZilPay: boolean = true;
  #eventListeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  constructor() {
    this.#initializeEvents();
    this.#setupFlutterEventHandler();
  }

  #initializeEvents() {
    this.#eventListeners.set('connect', new Set());
    this.#eventListeners.set('disconnect', new Set());
    this.#eventListeners.set('chainChanged', new Set());
    this.#eventListeners.set('accountsChanged', new Set());
    this.#eventListeners.set('message', new Set());
  }

  #setupFlutterEventHandler() {
    if (typeof window !== 'undefined' && window) {
      (window as any).handleZilPayEvent = (eventData: any) => {
        const listeners = this.#eventListeners.get(eventData.event);
        if (listeners) {
          listeners.forEach(callback => callback(eventData.data));
        }
      };
    }
  }

  async request(payload: RequestPayload): Promise<any> {
    return new Promise((resolve, reject) => {
      const uuid = Math.random().toString(36).substring(2);
      const message = {
        type: 'ZILPAY_REQUEST',
        uuid,
        payload,
      };

      if (typeof window !== 'undefined' && window && (window as any).FlutterWebView) {
        try {
          (window as any).FlutterWebView.postMessage(JSON.stringify(message));
        } catch (e) {
          reject(new Error(`Failed to send request: ${e}`));
          return;
        }
      } else {
        reject(new Error('FlutterWebView channel is not available'));
        return;
      }

      const responseHandler = (eventData: any) => {
        if (
          eventData.type === 'ZILPAY_RESPONSE' &&
          eventData.uuid === uuid
        ) {
          if (eventData.error) {
            reject(new Error(eventData.error));
          } else {
            resolve(eventData.result);
          }
          if (typeof window !== 'undefined' && window) {
            window.removeEventListener('message', responseHandler as any);
          }
        }
      };

      if (typeof window !== 'undefined' && window) {
        window.addEventListener('message', responseHandler as any);
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
}
