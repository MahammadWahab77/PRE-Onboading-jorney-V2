import type { PaymentStatus } from '../../../types/journey';

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  checkoutUrl: string;
  upiLink: string;
  upiQrCodeUrl: string;
  status: PaymentStatus;
}

export interface PaymentProviderInterface {
  createOrder(token: string, amount: number, learnerName: string): Promise<PaymentOrder>;
  getOrderStatus(orderId: string): Promise<{ status: PaymentStatus; receiptId?: string }>;
  simulatePaymentSuccess(orderId: string): Promise<{ status: PaymentStatus; receiptId: string }>;
}

class MockPaymentProvider implements PaymentProviderInterface {
  private orders: Map<
    string,
    { orderId: string; token: string; amount: number; status: PaymentStatus; receiptId?: string }
  > = new Map();

  public async createOrder(
    token: string,
    amount: number,
    learnerName: string
  ): Promise<PaymentOrder> {
    const orderId = `order_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const upiLink = `upi://pay?pa=nxtwave.edutech@icici&pn=NxtWave%20Disruptive%20Technologies&am=${amount}&tr=${orderId}&cu=INR&tn=PRE%20Genius%20Enrollment`;
    const upiQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      upiLink
    )}`;
    const checkoutUrl = `/enrollment/${token}/pay?orderId=${orderId}`;

    this.orders.set(orderId, {
      orderId,
      token,
      amount,
      status: 'PENDING',
    });

    return {
      orderId,
      amount,
      currency: 'INR',
      checkoutUrl,
      upiLink,
      upiQrCodeUrl,
      status: 'PENDING',
    };
  }

  public async getOrderStatus(
    orderId: string
  ): Promise<{ status: PaymentStatus; receiptId?: string }> {
    const order = this.orders.get(orderId);
    if (!order) return { status: 'NOT_STARTED' };
    return { status: order.status, receiptId: order.receiptId };
  }

  public async simulatePaymentSuccess(
    orderId: string
  ): Promise<{ status: PaymentStatus; receiptId: string }> {
    const receiptId = `RCP-PRE-${Date.now().toString().slice(-6)}`;
    const order = this.orders.get(orderId);
    if (order) {
      order.status = 'SUCCESS';
      order.receiptId = receiptId;
    }
    return { status: 'SUCCESS', receiptId };
  }
}

export const paymentProvider = new MockPaymentProvider();
