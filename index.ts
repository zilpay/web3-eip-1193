import { ZilPayProviderImpl } from './src/zilpay-provider';

export * from './src/types';
export * from './src/zilpay-provider';

(function() {
  if (typeof window === 'undefined' || !window) {
    console.warn('No window object available for ZilPay injection');
    return;
  }

  try {
    if ('ethereum' in window && window.ethereum) {
      console.warn('Ethereum provider already exists in window');
      return;
    }

    const provider = new ZilPayProviderImpl();

    try {
      Object.defineProperty(window, 'ethereum', {
        value: provider,
        writable: false,
        configurable: true,
      });
    } catch (defineError) {
      (window as any).ethereum = provider;
      console.warn('Using fallback assignment for ethereum due to:', defineError);
    }

    (window as any).__zilpay_response_handlers = (window as any).__zilpay_response_handlers || {};
    window.dispatchEvent(new Event('ethereum#initialized'));
    console.log('Ethereum provider injected successfully');
  } catch (error) {
    console.error('Failed to inject Ethereum provider:', error);
  }
})();
