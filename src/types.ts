export interface RequestPayload {
  method: string;
  params?: Array<any> | Record<string, any>;
}

export interface ProviderRpcError extends Error {
  name: string;
  message: string;
  code: number;
  data?: any;
}

export interface ProviderConnectInfo {
  readonly chainId: string;
}

export interface ProviderMessage {
  readonly type: string;
  readonly data: unknown;
}

export interface EthSubscription extends ProviderMessage {
  readonly type: 'eth_subscription';
  readonly data: {
    readonly subscription: string;
    readonly result: unknown;
  };
}

export interface ZilPayProvider {
  isZilPay: boolean;
  request(payload: RequestPayload): Promise<any>;
  on(event: 'connect', callback: (info: ProviderConnectInfo) => void): void;
  on(event: 'disconnect', callback: (error: ProviderRpcError) => void): void;
  on(event: 'chainChanged', callback: (chainId: string) => void): void;
  on(event: 'accountsChanged', callback: (accounts: string[]) => void): void;
  on(event: 'message', callback: (message: ProviderMessage) => void): void;
  removeListener(event: 'connect', callback: (info: ProviderConnectInfo) => void): void;
  removeListener(event: 'disconnect', callback: (error: ProviderRpcError) => void): void;
  removeListener(event: 'chainChanged', callback: (chainId: string) => void): void;
  removeListener(event: 'accountsChanged', callback: (accounts: string[]) => void): void;
  removeListener(event: 'message', callback: (message: ProviderMessage) => void): void;
  enable(): Promise<string[]>;
}

export interface ZilPayEventData {
  event: string;
  data: ProviderConnectInfo | ProviderRpcError | string | string[] | ProviderMessage;
}

export interface ZilPayResponseData  {
  type: string;
  uuid: string;
  error?: string;
  code?: number;
  data?: any;
  result?: any;
}
