import { getFavicon } from './favicon';
import { getMetaDataFromTags } from './meta';
import type { ProviderRpcError, RequestPayload, ZilPayProvider, ProviderConnectInfo, ProviderMessage, ZilPayEventData, ZilPayResponseData } from './types';

export class ZilPayProviderImpl implements ZilPayProvider {
  readonly isZilPay: boolean = true;
  readonly supportedMethods: Set<string> = new Set([
    'eth_requestAccounts',
    'eth_accounts', 
    'eth_sendTransaction',
    'eth_getBalance',
    'eth_getTransactionByHash',
    'eth_getTransactionReceipt',
    'eth_call',
    'eth_estimateGas',
    'eth_blockNumber',
    'eth_getBlockByNumber',
    'eth_getBlockByHash',
    'eth_subscribe',
    'eth_unsubscribe',
    'net_version',
    'eth_chainId',
    'eth_getCode',
    'eth_getStorageAt',
    'eth_gasPrice',
    'eth_signTypedData',
    'eth_signTypedData_v4',
    'eth_getTransactionCount',
    'personal_sign',
    'wallet_addEthereumChain',
    'wallet_switchEthereumChain',
    'wallet_watchAsset',
    'wallet_getPermissions',
    'wallet_requestPermissions',
    'wallet_scanQRCode',
    'eth_getEncryptionPublicKey',
    'eth_decrypt'
  ]);
  #eventListeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  constructor() {
    this.#initializeEvents();
    this.#setupFlutterEventHandler();
  }

  #initializeEvents() {
    this.#eventListeners.set('connect', new Set<(info: ProviderConnectInfo) => void>());
    this.#eventListeners.set('disconnect', new Set<(error: ProviderRpcError) => void>());
    this.#eventListeners.set('chainChanged', new Set<(chainId: string) => void>());
    this.#eventListeners.set('accountsChanged', new Set<(accounts: string[]) => void>());
    this.#eventListeners.set('message', new Set<(message: ProviderMessage) => void>());
  }

  #setupFlutterEventHandler() {
    if (typeof window !== 'undefined' && window) {
      (window as any).handleZilPayEvent = (eventData: ZilPayEventData) => {
        const listeners = this.#eventListeners.get(eventData.event);
        if (listeners) {
          switch (eventData.event) {
            case 'connect':
              listeners.forEach(callback => callback(eventData.data as ProviderConnectInfo));
              break;
            case 'disconnect':
              listeners.forEach(callback => callback(eventData.data as ProviderRpcError));
              break;
            case 'chainChanged':
              const chainId = eventData.data as string;
              if (typeof chainId !== 'string' || !chainId.startsWith('0x')) {
                console.warn('Invalid chainId format for chainChanged event');
                return;
              }
              listeners.forEach(callback => callback(chainId));
              break;
            case 'accountsChanged':
              listeners.forEach(callback => callback(eventData.data as string[]));
              break;
            case 'message':
              listeners.forEach(callback => callback(eventData.data as ProviderMessage));
              break;
          }
        }
      };
    }
  }

  async request(payload: RequestPayload): Promise<unknown> {
    if (!this.supportedMethods.has(payload.method)) {
      return Promise.reject({
        message: 'Unsupported method',
        code: 4200,
        data: { method: payload.method },
      } as ProviderRpcError);
    }

    const icon = getFavicon();

    return new Promise((resolve, reject) => {
      const uuid = Math.random().toString(36).substring(2);
      const meta = getMetaDataFromTags();
      const message = {
        type: 'ZILPAY_REQUEST',
        uuid,
        payload,
        icon,
        ...meta,
      };

      if (typeof window === 'undefined' || !window || !(window as any).EIP1193Channel) {
        reject({
          message: 'ZilPay channel is not available',
          code: 4900,
          data: null,
        } as ProviderRpcError);
        return;
      }

      try {
        (window as any).EIP1193Channel.postMessage(JSON.stringify(message));
      } catch (e: unknown) {
        reject({
          message: `Failed to send request: ${(e as Error).message}`,
          code: 4000,
          data: e,
        } as ProviderRpcError);
        return;
      }

      const responseHandler = (event: MessageEvent) => {
        let eventData: ZilPayResponseData = event.data;

        if (eventData.type === 'ZILPAY_RESPONSE' && eventData.uuid === uuid) {
          if (eventData.payload.error) {
            reject({
              message: eventData.payload.error.message,
              code: eventData.payload.error.code || 4000,
              data: eventData.payload.error.data,
            } as ProviderRpcError);
          } else {
            resolve(eventData.payload.result);
          }
          window.removeEventListener('message', responseHandler);
        }
      };

      window.addEventListener('message', responseHandler);
    });
  }

  async enable(): Promise<string[]> {
    return this.request({ method: 'eth_requestAccounts' }) as Promise<string[]>;
  }

  on(event: 'connect', callback: (info: ProviderConnectInfo) => void): void;
  on(event: 'disconnect', callback: (error: ProviderRpcError) => void): void;
  on(event: 'chainChanged', callback: (chainId: string) => void): void;
  on(event: 'accountsChanged', callback: (accounts: string[]) => void): void;
  on(event: 'message', callback: (message: ProviderMessage) => void): void;
  on(event: string, callback: (...args: any[]) => void): void {
    const listeners = this.#eventListeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }
  }

  removeListener(event: 'connect', callback: (info: ProviderConnectInfo) => void): void;
  removeListener(event: 'disconnect', callback: (error: ProviderRpcError) => void): void;
  removeListener(event: 'chainChanged', callback: (chainId: string) => void): void;
  removeListener(event: 'accountsChanged', callback: (accounts: string[]) => void): void;
  removeListener(event: 'message', callback: (message: ProviderMessage) => void): void;
  removeListener(event: string, callback: (...args: any[]) => void): void {
    const listeners = this.#eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }
}
