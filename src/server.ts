import { createApp } from './app';

const PORT = Number(process.env.PORT) || 3000;
const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` 🛍️  Openfront Modern - Standalone Commerce Engine`);
  console.log(` 🌐 Storefront: http://localhost:${PORT}`);
  console.log(` ⚙️  Admin Panel: http://localhost:${PORT}/admin`);
  console.log(` 🔌 REST API:   http://localhost:${PORT}/api/products`);
  console.log(`====================================================`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server terminated gracefully');
  });
});
