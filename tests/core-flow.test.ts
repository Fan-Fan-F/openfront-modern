import { test, describe, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/data/store';
import { currencyService } from '../src/services/currency.service';
import { orderService } from '../src/services/order.service';
import { mockPaymentGateway } from '../src/services/payment.service';

describe('Openfront Modern Core Commerce Flow', () => {
  beforeEach(() => {
    db.resetToDefault();
  });

  describe('1. Product Catalog & Categories', () => {
    test('should load default products and categories', () => {
      const products = db.getProducts();
      const categories = db.getCategories();

      assert.ok(products.length >= 8, 'Should have at least 8 seeded products');
      assert.ok(categories.length >= 4, 'Should have 4 categories');

      const firstProduct = products[0];
      assert.ok(firstProduct.id);
      assert.ok(firstProduct.title);
      assert.ok(firstProduct.price > 0);
      assert.ok(firstProduct.inventory > 0);
    });

    test('should filter products by category slug and search keyword', () => {
      const electronics = db.getProducts({ categorySlug: 'electronics' });
      assert.ok(electronics.length > 0);
      electronics.forEach(p => assert.equal(p.categoryId, 'cat-1'));

      const searchResults = db.getProducts({ search: 'Keyboard' });
      assert.equal(searchResults.length, 1);
      assert.ok(searchResults[0].title.includes('Keyboard'));
    });
  });

  describe('2. Multi-Currency Engine', () => {
    test('should convert USD to EUR, GBP, and JPY accurately', () => {
      const priceUSD = 100.0;
      const eur = currencyService.convertFromUSD(priceUSD, 'EUR');
      const gbp = currencyService.convertFromUSD(priceUSD, 'GBP');
      const jpy = currencyService.convertFromUSD(priceUSD, 'JPY');

      assert.equal(eur, 92.0); // 100 * 0.92
      assert.equal(gbp, 79.0); // 100 * 0.79
      assert.equal(jpy, 15450); // 100 * 154.5 rounded
    });

    test('should format price with proper currency symbols', () => {
      assert.equal(currencyService.formatPrice(199.0, 'USD'), '$199.00');
      assert.equal(currencyService.formatPrice(92.0, 'EUR'), '€92.00');
      assert.equal(currencyService.formatPrice(15450, 'JPY'), '¥15,450');
    });

    test('should update non-base currency rates', () => {
      const ok = currencyService.updateRate('EUR', 0.95);
      assert.equal(ok, true);
      assert.equal(currencyService.convertFromUSD(100, 'EUR'), 95.0);

      // Cannot update USD base
      const failBase = db.updateCurrencyRate('USD', 1.5);
      assert.equal(failBase, false);
    });
  });

  describe('3. Checkout and Mock Payment Gateway Loop', () => {
    test('should successfully checkout with mock_card, capture payment, and deduct stock', async () => {
      const prod = db.getProductById('prod-101')!;
      const initialStock = prod.inventory;

      const order = await orderService.checkout({
        items: [{ productId: 'prod-101', quantity: 2 }],
        currency: 'USD',
        shippingAddress: {
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          street: '100 Market St',
          city: 'San Francisco',
          postalCode: '94105',
          country: 'USA'
        },
        paymentMethod: 'mock_card',
        cardNumber: '4242 4242 4242 4000'
      });

      assert.ok(order.id);
      assert.ok(order.orderNumber.startsWith('OF-'));
      assert.equal(order.status, 'paid');
      assert.equal(order.payment.status, 'captured');
      assert.ok(order.payment.transactionId.startsWith('txn_mock_'));

      // Subtotal: 199 * 2 = 398. Shipping: 15. Tax: 398 * 0.05 = 19.9. Total: 432.90
      assert.equal(order.subtotal, 398);
      assert.equal(order.shippingFee, 15);
      assert.equal(order.tax, 19.9);
      assert.equal(order.total, 432.9);

      // Check stock deduction
      const updatedProd = db.getProductById('prod-101')!;
      assert.equal(updatedProd.inventory, initialStock - 2);
    });

    test('should support multi-currency checkout (e.g. EUR) with exchange rate stored', async () => {
      const order = await orderService.checkout({
        items: [{ productId: 'prod-103', quantity: 1 }], // price USD 69.00
        currency: 'EUR', // rate 0.92
        shippingAddress: {
          fullName: 'Hans Mueller',
          email: 'hans@example.de',
          street: 'Alexanderplatz 1',
          city: 'Berlin',
          postalCode: '10178',
          country: 'Germany'
        },
        paymentMethod: 'mock_stripe'
      });

      assert.equal(order.currency, 'EUR');
      assert.equal(order.exchangeRate, 0.92);
      assert.equal(order.status, 'paid');
      assert.equal(order.subtotal, 63.48); // 69 * 0.92
      assert.ok(order.payment.transactionId.startsWith('ch_stripe_mock_'));
    });

    test('should simulate decline when card ends in 4002 without deducting stock', async () => {
      const prod = db.getProductById('prod-102')!;
      const stockBefore = prod.inventory;

      await assert.rejects(
        async () => {
          await orderService.checkout({
            items: [{ productId: 'prod-102', quantity: 1 }],
            currency: 'USD',
            shippingAddress: {
              fullName: 'Decline Tester',
              email: 'decline@test.com',
              street: 'Fail Ave',
              city: 'Nowhere',
              postalCode: '00000',
              country: 'USA'
            },
            paymentMethod: 'mock_card',
            cardNumber: '4242 4242 4242 4002'
          });
        },
        /Payment processing failed/
      );

      const stockAfter = db.getProductById('prod-102')!;
      assert.equal(stockAfter.inventory, stockBefore, 'Stock must not be deducted on failed payment');
    });

    test('should handle Cash on Delivery with pending payment and processing status', async () => {
      const order = await orderService.checkout({
        items: [{ productId: 'prod-107', quantity: 1 }],
        currency: 'USD',
        shippingAddress: {
          fullName: 'COD Tester',
          email: 'cod@test.com',
          street: 'Cash Rd',
          city: 'Chicago',
          postalCode: '60601',
          country: 'USA'
        },
        paymentMethod: 'mock_cod'
      });

      assert.equal(order.status, 'processing');
      assert.equal(order.payment.status, 'pending');
      assert.equal(order.payment.method, 'mock_cod');
    });
  });

  describe('4. Order Lifecycle & Admin Management', () => {
    test('should transition order status through shipping and restock inventory on cancel/refund', async () => {
      const prod = db.getProductById('prod-106')!;
      const originalStock = prod.inventory;

      const order = await orderService.checkout({
        items: [{ productId: 'prod-106', quantity: 2 }],
        currency: 'USD',
        shippingAddress: {
          fullName: 'Lifecycle Tester',
          email: 'lifecycle@test.com',
          street: 'Life Way',
          city: 'Austin',
          postalCode: '78701',
          country: 'USA'
        },
        paymentMethod: 'mock_card'
      });

      assert.equal(db.getProductById('prod-106')!.inventory, originalStock - 2);

      // Ship order
      const shipped = orderService.updateOrderStatus(order.id, 'shipped');
      assert.equal(shipped.status, 'shipped');

      // Cancel / refund should restore inventory
      const refunded = orderService.updateOrderStatus(order.id, 'refunded');
      assert.equal(refunded.status, 'refunded');
      assert.equal(refunded.payment.status, 'refunded');
      assert.equal(db.getProductById('prod-106')!.inventory, originalStock);
    });

    test('should accurately calculate admin revenue and metrics', async () => {
      await orderService.checkout({
        items: [{ productId: 'prod-101', quantity: 1 }], // 199 + 15 shipping + 9.95 tax = 223.95
        currency: 'USD',
        shippingAddress: {
          fullName: 'Admin Tester',
          email: 'admin@test.com',
          street: '1st St',
          city: 'Seattle',
          postalCode: '98101',
          country: 'USA'
        },
        paymentMethod: 'mock_card'
      });

      const stats = db.getStats();
      assert.ok(stats.totalRevenueUSD > 0);
      assert.equal(stats.totalOrders, 1);
      assert.equal(stats.paidOrders, 1);
      assert.equal(stats.totalProducts, 8);
    });
  });
});
