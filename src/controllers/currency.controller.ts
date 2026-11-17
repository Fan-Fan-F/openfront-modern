import { Request, Response } from 'express';
import { currencyService } from '../services/currency.service';
import { CurrencyCode } from '../types';

export class CurrencyController {
  public static getCurrencies(_req: Request, res: Response): void {
    try {
      const list = currencyService.getAll();
      res.json({ success: true, data: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static updateRate(req: Request, res: Response): void {
    try {
      const { code, rate } = req.body;
      if (!code || typeof rate !== 'number') {
        res.status(400).json({ success: false, error: 'code and numerical rate are required' });
        return;
      }

      const ok = currencyService.updateRate(code as CurrencyCode, rate);
      if (!ok) {
        res.status(400).json({ success: false, error: 'Could not update rate (cannot modify base currency)' });
        return;
      }

      res.json({ success: true, message: `Currency ${code} rate updated to ${rate}` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
