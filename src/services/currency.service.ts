import { db } from '../data/store';
import { Currency, CurrencyCode } from '../types';

export class CurrencyService {
  public getAll(): Currency[] {
    return db.getCurrencies();
  }

  public getCurrency(code: CurrencyCode): Currency {
    const cur = db.getCurrency(code);
    if (!cur) {
      throw new Error(`Unsupported currency code: ${code}`);
    }
    return cur;
  }

  public convertFromUSD(amountUSD: number, targetCurrency: CurrencyCode): number {
    const cur = this.getCurrency(targetCurrency);
    const converted = amountUSD * cur.rate;
    // JPY typically has 0 decimals, others 2
    if (targetCurrency === 'JPY') {
      return Math.round(converted);
    }
    return Math.round(converted * 100) / 100;
  }

  public convertToUSD(amount: number, fromCurrency: CurrencyCode): number {
    const cur = this.getCurrency(fromCurrency);
    if (cur.rate <= 0) return amount;
    const usd = amount / cur.rate;
    return Math.round(usd * 100) / 100;
  }

  public formatPrice(amount: number, currencyCode: CurrencyCode): string {
    const cur = this.getCurrency(currencyCode);
    if (currencyCode === 'JPY') {
      return `${cur.symbol}${Math.round(amount).toLocaleString()}`;
    }
    return `${cur.symbol}${amount.toFixed(2)}`;
  }

  public updateRate(code: CurrencyCode, rate: number): boolean {
    if (rate <= 0) {
      throw new Error('Exchange rate must be greater than zero');
    }
    return db.updateCurrencyRate(code, rate);
  }
}

export const currencyService = new CurrencyService();
