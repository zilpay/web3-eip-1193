import { ZilPayProviderImpl } from './src/zilpay-provider';

export * from './src/types';
export * from './src/zilpay-provider';

(function() {
  if (typeof window === 'undefined' || !window) {
    console.warn('No window object available for ZilPay injection');
    return;
  }

  try {
    if ('zilPay' in window && window.zilPay) {
      console.warn('ZilPay provider already exists in window');
      return;
    }

    const provider = new ZilPayProviderImpl();

    try {
      Object.defineProperty(window, 'zilPay', {
        value: provider,
        writable: false,
        configurable: true
      });
    } catch (defineError) {
      (window as any).zilPay = provider;
      console.warn('Using fallback assignment for zilPay due to:', defineError);
    }

    window.dispatchEvent(new Event('zilPay#initialized'));
    console.log('ZilPay provider injected successfully');
    
  } catch (error) {
    console.error('Failed to inject ZilPay provider:', error);
  }
})();
