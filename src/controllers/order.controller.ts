import { Request, Response } from 'express';
import { orderService } from '../services/order.service';
import { CheckoutRequest } from '../types';

export class OrderController {
  public static async checkout(req: Request, res: Response): Promise<void> {
    try {
      const checkoutData: CheckoutRequest = req.body;
      const order = await orderService.checkout(checkoutData);
      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created and payment processed successfully'
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public static getOrder(req: Request, res: Response): void {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const order = orderService.getOrder(id);
      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found' });
        return;
      }
      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static getAllOrders(_req: Request, res: Response): void {
    try {
      const orders = orderService.getAllOrders();
      res.json({ success: true, data: orders });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static updateStatus(req: Request, res: Response): void {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status } = req.body;
      if (!status) {
        res.status(400).json({ success: false, error: 'status is required' });
        return;
      }

      const updated = orderService.updateOrderStatus(id, status);
      res.json({ success: true, data: updated, message: `Order status changed to ${status}` });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
}
