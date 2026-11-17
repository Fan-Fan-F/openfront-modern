import { Request, Response } from 'express';
import { db } from '../data/store';

export class AdminController {
  public static getStats(_req: Request, res: Response): void {
    try {
      const stats = db.getStats();
      res.json({ success: true, data: stats });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static resetData(_req: Request, res: Response): void {
    try {
      db.resetToDefault();
      res.json({ success: true, message: 'Database reset to default seed data' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
