import fs from 'fs';
import path from 'path';
import { Product, Category, Currency, Order, OrderStatus, CurrencyCode, AdminStats } from '../types';

interface DatabaseSchema {
  currencies: Currency[];
  categories: Category[];
  products: Product[];
  orders: Order[];
}

const DEFAULT_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0, isBase: true },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 154.5 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 7.24 }
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Electronics', slug: 'electronics', description: 'Modern gadgets, smart audio, and desktop accessories' },
  { id: 'cat-2', name: 'Apparel', slug: 'apparel', description: 'Minimalist sustainable everyday wear and essentials' },
  { id: 'cat-3', name: 'Home & Living', slug: 'home-living', description: 'Ergonomic workspace items and home decor' },
  { id: 'cat-4', name: 'Accessories', slug: 'accessories', description: 'Leather goods, EDC gear, and travel accessories' }
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-101',
    title: 'Acoustic Wireless Headphones Pro',
    slug: 'acoustic-wireless-headphones-pro',
    description: 'Active noise-cancelling studio wireless headphones with 40h battery life and spatial audio.',
    price: 199.0,
    categoryId: 'cat-1',
    categoryName: 'Electronics',
    inventory: 45,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
    sku: 'AUDIO-ANC-01',
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-102',
    title: 'Minimalist Mechanical Keyboard',
    slug: 'minimalist-mechanical-keyboard',
    description: '75% layout wireless mechanical keyboard with hot-swappable switches and aluminum frame.',
    price: 129.0,
    categoryId: 'cat-1',
    categoryName: 'Electronics',
    inventory: 28,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
    sku: 'KB-MECH-75',
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-103',
    title: 'Precision Ergonomic Mouse',
    slug: 'precision-ergonomic-mouse',
    description: 'Ultra-lightweight wireless optical mouse with dual connectivity and magnetic scroll wheel.',
    price: 69.0,
    categoryId: 'cat-1',
    categoryName: 'Electronics',
    inventory: 50,
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&q=80',
    sku: 'MSE-ERGO-02',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-104',
    title: 'Organic Heavyweight Crewneck Sweatshirt',
    slug: 'organic-heavyweight-crewneck',
    description: '450 GSM organic French terry cotton sweatshirt tailored for structured relaxed fit.',
    price: 85.0,
    categoryId: 'cat-2',
    categoryName: 'Apparel',
    inventory: 60,
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80',
    sku: 'APP-CRW-BLK',
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-105',
    title: 'Raw Denim Straight-Leg Trousers',
    slug: 'raw-denim-straight-leg',
    description: '14oz selvedge Japanese denim woven on vintage shuttle looms, durable and timeless.',
    price: 145.0,
    categoryId: 'cat-2',
    categoryName: 'Apparel',
    inventory: 20,
    imageUrl: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=600&q=80',
    sku: 'APP-DNM-SLV',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-106',
    title: 'Solid Walnut Monitor Stand & Riser',
    slug: 'solid-walnut-monitor-stand',
    description: 'Sustainably sourced North American walnut desk riser with integrated cable management shelf.',
    price: 95.0,
    categoryId: 'cat-3',
    categoryName: 'Home & Living',
    inventory: 15,
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80',
    sku: 'DSK-RISER-WLN',
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-107',
    title: 'Ceramic Pour-Over Coffee Dripper Set',
    slug: 'ceramic-pour-over-coffee-set',
    description: 'Handcrafted stoneware dripper with heat-resistant borosilicate glass server and bamboo lid.',
    price: 48.0,
    categoryId: 'cat-3',
    categoryName: 'Home & Living',
    inventory: 35,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80',
    sku: 'KIT-COF-DRP',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-108',
    title: 'Full-Grain Italian Leather Cardholder',
    slug: 'leather-cardholder-wallet',
    description: 'Slim vegetable-tanned leather wallet with 5 card slots and RFID protection lining.',
    price: 42.0,
    categoryId: 'cat-4',
    categoryName: 'Accessories',
    inventory: 5, // low stock for testing alerts
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80',
    sku: 'ACC-WLT-TAN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export class StoreDatabase {
  private dbPath: string;
  private data: DatabaseSchema;

  constructor(customPath?: string) {
    this.dbPath = customPath || path.resolve(process.cwd(), 'data/runtime/store-db.json');
    this.data = this.loadOrInit();
  }

  private loadOrInit(): DatabaseSchema {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.products && parsed.currencies && parsed.categories) {
          return parsed;
        }
      }
    } catch {
      // In case of parsing error, re-initialize
    }

    const initial: DatabaseSchema = {
      currencies: JSON.parse(JSON.stringify(DEFAULT_CURRENCIES)),
      categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
      products: JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)),
      orders: []
    };

    this.persist(initial);
    return initial;
  }

  private persist(dataToSave?: DatabaseSchema): void {
    const data = dataToSave || this.data;
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = `${this.dbPath}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, this.dbPath);
  }

  // Categories
  public getCategories(): Category[] {
    return [...this.data.categories];
  }

  // Currencies
  public getCurrencies(): Currency[] {
    return [...this.data.currencies];
  }

  public getCurrency(code: CurrencyCode): Currency | undefined {
    return this.data.currencies.find(c => c.code === code);
  }

  public updateCurrencyRate(code: CurrencyCode, rate: number): boolean {
    const cur = this.data.currencies.find(c => c.code === code);
    if (!cur || cur.isBase) return false;
    cur.rate = rate;
    this.persist();
    return true;
  }

  // Products
  public getProducts(options?: { categorySlug?: string; search?: string }): Product[] {
    let list = [...this.data.products];
    if (options?.categorySlug) {
      const cat = this.data.categories.find(c => c.slug === options.categorySlug);
      if (cat) {
        list = list.filter(p => p.categoryId === cat.id);
      }
    }
    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }
    return list;
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  public createProduct(payload: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const id = `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const cat = this.data.categories.find(c => c.id === payload.categoryId);
    const newProduct: Product = {
      ...payload,
      id,
      categoryName: cat ? cat.name : 'General',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.products.unshift(newProduct);
    this.persist();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) return null;

    if (updates.categoryId && updates.categoryId !== this.data.products[index].categoryId) {
      const cat = this.data.categories.find(c => c.id === updates.categoryId);
      if (cat) updates.categoryName = cat.name;
    }

    const updated: Product = {
      ...this.data.products[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    };
    this.data.products[index] = updated;
    this.persist();
    return updated;
  }

  public deleteProduct(id: string): boolean {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => p.id !== id);
    if (this.data.products.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public adjustInventory(id: string, delta: number): boolean {
    const prod = this.data.products.find(p => p.id === id);
    if (!prod) return false;
    prod.inventory = Math.max(0, prod.inventory + delta);
    prod.updatedAt = new Date().toISOString();
    this.persist();
    return true;
  }

  // Orders
  public getOrders(): Order[] {
    return [...this.data.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrderById(id: string): Order | undefined {
    return this.data.orders.find(o => o.id === id || o.orderNumber === id);
  }

  public createOrder(order: Order): Order {
    this.data.orders.unshift(order);
    this.persist();
    return order;
  }

  public updateOrderStatus(id: string, status: OrderStatus): Order | null {
    const order = this.data.orders.find(o => o.id === id || o.orderNumber === id);
    if (!order) return null;

    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (status === 'paid' && order.payment.status !== 'captured') {
      order.payment.status = 'captured';
      order.payment.paidAt = new Date().toISOString();
    } else if (status === 'refunded') {
      order.payment.status = 'refunded';
    }
    this.persist();
    return order;
  }

  // Stats
  public getStats(): AdminStats {
    let totalRevenueUSD = 0;
    let paidOrders = 0;

    for (const order of this.data.orders) {
      if (order.status === 'paid' || order.status === 'completed' || order.status === 'shipped') {
        paidOrders++;
        const revenueUSD = order.exchangeRate > 0 ? order.total / order.exchangeRate : order.total;
        totalRevenueUSD += revenueUSD;
      }
    }

    const lowStock = this.data.products.filter(p => p.inventory <= 10).length;

    return {
      totalRevenueUSD: Math.round(totalRevenueUSD * 100) / 100,
      totalOrders: this.data.orders.length,
      paidOrders,
      totalProducts: this.data.products.length,
      lowStockProducts: lowStock
    };
  }

  public resetToDefault(): void {
    this.data = {
      currencies: JSON.parse(JSON.stringify(DEFAULT_CURRENCIES)),
      categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
      products: JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)),
      orders: []
    };
    this.persist();
  }
}

export const db = new StoreDatabase();
