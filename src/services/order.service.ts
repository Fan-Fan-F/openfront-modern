import { db } from '../data/store';
import { currencyService } from './currency.service';
import { mockPaymentGateway } from './payment.service';
import {
  Order,
  OrderItem,
  CheckoutRequest,
  OrderStatus,
  CurrencyCode
} from '../types';

export class OrderService {
  /**
   * Validate cart, compute totals in specified currency, create order, process mock payment.
   */
  public async checkout(request: CheckoutRequest): Promise<Order> {
    const { items, currency, shippingAddress, paymentMethod, cardNumber } = request;

    if (!items || items.length === 0) {
      throw new Error('Shopping cart cannot be empty');
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.email || !shippingAddress.street) {
      throw new Error('Shipping address is incomplete. Full name, email, and street are required.');
    }

    const cur = currencyService.getCurrency(currency);
    const orderItems: OrderItem[] = [];
    let subtotalCharged = 0;

    // Validate inventory and prepare items
    for (const item of items) {
      if (item.quantity <= 0) {
        throw new Error(`Invalid item quantity: ${item.quantity}`);
      }

      const product = db.getProductById(item.productId);
      if (!product) {
        throw new Error(`Product not found with ID: ${item.productId}`);
      }

      if (product.inventory < item.quantity) {
        throw new Error(`Insufficient inventory for "${product.title}". Requested: ${item.quantity}, Available: ${product.inventory}`);
      }

      const unitPriceCharged = currencyService.convertFromUSD(product.price, currency);
      const itemTotalCharged = currency === 'JPY'
        ? Math.round(unitPriceCharged * item.quantity)
        : Math.round(unitPriceCharged * item.quantity * 100) / 100;

      orderItems.push({
        productId: product.id,
        title: product.title,
        sku: product.sku,
        quantity: item.quantity,
        unitPriceBase: product.price,
        unitPriceCharged,
        totalCharged: itemTotalCharged
      });

      subtotalCharged += itemTotalCharged;
    }

    // Shipping fee & Tax calculation (simplified realistic model)
    const baseShippingUSD = subtotalCharged > 0 ? 15.0 : 0;
    const shippingFee = currencyService.convertFromUSD(baseShippingUSD, currency);
    // 5% standard sales tax
    const tax = currency === 'JPY'
      ? Math.round(subtotalCharged * 0.05)
      : Math.round(subtotalCharged * 0.05 * 100) / 100;
    
    const total = currency === 'JPY'
      ? Math.round(subtotalCharged + shippingFee + tax)
      : Math.round((subtotalCharged + shippingFee + tax) * 100) / 100;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `OF-${dateStr}-${randomHex}`;
    const orderId = `ord-${Date.now()}`;

    // Process payment through mock gateway
    const payment = await mockPaymentGateway.processPayment({
      orderNumber,
      amount: total,
      currency,
      method: paymentMethod,
      cardNumber
    });

    let initialStatus: OrderStatus = 'pending';
    if (payment.status === 'captured') {
      initialStatus = 'paid';
    } else if (payment.method === 'mock_cod') {
      initialStatus = 'processing';
    } else if (payment.status === 'failed') {
      initialStatus = 'pending';
    }

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      items: orderItems,
      currency,
      exchangeRate: cur.rate,
      subtotal: subtotalCharged,
      shippingFee,
      tax,
      total,
      shippingAddress,
      status: initialStatus,
      payment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // If payment succeeded or COD, deduct stock
    if (payment.status === 'captured' || payment.method === 'mock_cod') {
      for (const item of items) {
        db.adjustInventory(item.productId, -item.quantity);
      }
    }

    db.createOrder(newOrder);

    if (payment.status === 'failed') {
      throw new Error(`Payment processing failed: ${payment.failureReason || 'Card declined'}`);
    }

    return newOrder;
  }

  public getOrder(idOrNumber: string): Order | undefined {
    return db.getOrderById(idOrNumber);
  }

  public getAllOrders(): Order[] {
    return db.getOrders();
  }

  public updateOrderStatus(orderId: string, newStatus: OrderStatus): Order {
    const existing = db.getOrderById(orderId);
    if (!existing) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Rollback inventory if order is cancelled or refunded from a previously active state
    if (
      (newStatus === 'cancelled' || newStatus === 'refunded') &&
      existing.status !== 'cancelled' &&
      existing.status !== 'refunded'
    ) {
      for (const item of existing.items) {
        db.adjustInventory(item.productId, item.quantity);
      }
    }

    const updated = db.updateOrderStatus(orderId, newStatus);
    if (!updated) {
      throw new Error(`Failed to update status for order: ${orderId}`);
    }
    return updated;
  }
}

export const orderService = new OrderService();
