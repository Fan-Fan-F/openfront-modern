import { Request, Response } from 'express';
import { db } from '../data/store';

export class ProductController {
  public static getProducts(req: Request, res: Response): void {
    try {
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;

      const products = db.getProducts({ categorySlug: category, search });
      res.json({ success: true, data: products });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static getProductById(req: Request, res: Response): void {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const product = db.getProductById(id);
      if (!product) {
        res.status(404).json({ success: false, error: 'Product not found' });
        return;
      }
      res.json({ success: true, data: product });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static getCategories(_req: Request, res: Response): void {
    try {
      const categories = db.getCategories();
      res.json({ success: true, data: categories });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static createProduct(req: Request, res: Response): void {
    try {
      const { title, slug, description, price, categoryId, inventory, imageUrl, sku, featured } = req.body;
      if (!title || price === undefined || !categoryId || !sku) {
        res.status(400).json({ success: false, error: 'title, price, categoryId, and sku are required' });
        return;
      }

      const newProduct = db.createProduct({
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: description || '',
        price: Number(price),
        categoryId,
        categoryName: '',
        inventory: Number(inventory) || 0,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
        sku,
        featured: Boolean(featured)
      });

      res.status(201).json({ success: true, data: newProduct });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static updateProduct(req: Request, res: Response): void {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = db.updateProduct(id, req.body);
      if (!updated) {
        res.status(404).json({ success: false, error: 'Product not found' });
        return;
      }
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static deleteProduct(req: Request, res: Response): void {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const deleted = db.deleteProduct(id);
      if (!deleted) {
        res.status(404).json({ success: false, error: 'Product not found' });
        return;
      }
      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
