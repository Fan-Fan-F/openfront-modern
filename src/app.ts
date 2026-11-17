import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import apiRoutes from './routes/api.routes';

export function createApp(): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Resolve static files directory
  const rootPublic = path.resolve(process.cwd(), 'public');
  if (fs.existsSync(rootPublic)) {
    app.use(express.static(rootPublic));
  }

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'openfront-modern',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Mount API routes
  app.use('/api', apiRoutes);

  // Storefront route fallback
  app.get('/', (_req: Request, res: Response) => {
    const indexPath = path.join(rootPublic, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send('<h1>Openfront Modern Storefront</h1><p>Visit /api/products for API</p>');
    }
  });

  // Admin route fallback
  app.get('/admin', (_req: Request, res: Response) => {
    const adminPath = path.join(rootPublic, 'admin.html');
    if (fs.existsSync(adminPath)) {
      res.sendFile(adminPath);
    } else {
      res.send('<h1>Openfront Modern Admin</h1><p>Visit /api/admin/stats for API</p>');
    }
  });

  return app;
}
