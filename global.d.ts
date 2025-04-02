// global.d.ts
export {};

declare global {
  interface Window {
    magicEden?: {
      bitcoin: any;
    };
    unisat?: {
      requestAccounts: () => Promise<string[]>;
      getAccounts: () => Promise<string[]>;
      [key: string]: any;
    };
    XverseProviders?: {
      BitcoinProvider?: {
        request: (method: string, params: any) => Promise<any>;
      };
    };
  }
}