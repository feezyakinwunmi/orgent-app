declare module '@paystack/inline-js' {
  interface PaystackTransactionOptions {
    key: string;
    email: string;
    amount: number;
    currency?: string;
    ref?: string;
    metadata?: any;
    onSuccess?: (transaction: any) => void;
    onCancel?: () => void;
    onError?: (error: any) => void;
    callback?: (response: any) => void;
  }

  interface PaystackPop {
    newTransaction(options: PaystackTransactionOptions): void;
  }

  const PaystackPop: {
    new (): PaystackPop;
  };

  export default PaystackPop;
}