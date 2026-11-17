import { PaymentMethod, PaymentDetails } from '../types';

export interface PaymentProcessInput {
  orderNumber: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  cardNumber?: string;
}

export class MockPaymentGateway {
  private gatewayName: string = 'Openfront MockPay Engine';

  /**
   * Process a simulated payment.
   * If cardNumber ends in '0000' or '4002', triggers simulated decline.
   */
  public async processPayment(input: PaymentProcessInput): Promise<PaymentDetails> {
    const { orderNumber, method, cardNumber } = input;
    const sanitizedCard = (cardNumber || '').replace(/\s+/g, '');

    // Simulation: card ending with 0000 or 4002 triggers simulated decline
    if (sanitizedCard.endsWith('0000') || sanitizedCard.endsWith('4002')) {
      return {
        provider: this.gatewayName,
        method,
        status: 'failed',
        transactionId: `txn_fail_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        failureReason: 'Card declined: Insufficient funds or simulated test decline.'
      };
    }

    // Cash on Delivery
    if (method === 'mock_cod') {
      return {
        provider: this.gatewayName,
        method,
        status: 'pending',
        transactionId: `cod_${orderNumber}_${Date.now()}`
      };
    }

    // Immediate capture for mock card or mock stripe
    const prefix = method === 'mock_stripe' ? 'ch_stripe_mock' : 'txn_mock';
    return {
      provider: this.gatewayName,
      method,
      status: 'captured',
      transactionId: `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      paidAt: new Date().toISOString()
    };
  }

  public async refundPayment(transactionId: string): Promise<{ success: boolean; refundId: string }> {
    return {
      success: true,
      refundId: `re_${Date.now()}_${Math.floor(Math.random() * 10000)}`
    };
  }
}

export const mockPaymentGateway = new MockPaymentGateway();
