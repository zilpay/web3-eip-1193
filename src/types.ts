
export interface RequestPayload {
  method: string;
  params?: Array<any> | Record<string, any>;
}

export interface ZilPayProvider {
  isZilPay: boolean;
  request(payload: RequestPayload): Promise<any>;
  on(event: string, callback: (...args: any[]) => void): void;
  removeListener(event: string, callback: (...args: any[]) => void): void;
  enable(): Promise<string[]>;
}

export interface ZilPayMethods {
  'requestAccounts': () => Promise<string[]>;
  'getAccounts': () => Promise<string[]>;
  'signMessage': (message: string) => Promise<string>;
  'sendTransaction': (txParams: {
    to: string;
    value: string;
    gasPrice: string;
    gasLimit: string;
    data?: string;
  }) => Promise<string>;
}


declare global {
  interface Window {
    zilPay: ZilPayProvider;
  }
}
