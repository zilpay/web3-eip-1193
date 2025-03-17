import { ZilPayProviderImpl } from './src/zilpay-provider';
import { announceProvider, setupEIP6963RequestListener } from './src/eip6963-utils';

export * from './src/types';
export * from './src/zilpay-provider';

(function() {
  if (typeof window === 'undefined' || !window) {
    console.warn('No window object available for ZilPay injection');
    return;
  }

  if ((window as any).__zilpayInjected) {
    return;
  }

  try {
    const provider = new ZilPayProviderImpl();
    
    if (!('ethereum' in window) || !window.ethereum) {
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
    }

    announceProvider(provider);
    setupEIP6963RequestListener(provider);

    (window as any).__zilpay_response_handlers = (window as any).__zilpay_response_handlers || {};
    (window as any).__zilpayInjected = true;
    window.dispatchEvent(new Event('ethereum#initialized'));
  } catch (error) {
    console.error('Failed to inject Ethereum provider:', error);
  }
})();

