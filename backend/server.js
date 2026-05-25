import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize, Lead } from './models/index.js';
import apiRouter from './routes/api.js';
import { seedDemoLeads } from './controllers/leadController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
// Enable global CORS to permit both the local React development frontend on port 5173
// and external website forms sending leads directly to our public webhook on port 5000.
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'CRM API Server is running',
    version: '1.0.0',
    db_dialect: process.env.DB_DIALECT || 'sqlite',
    server_time: new Date().toISOString()
  });
});

// Mount the API Router under /api
app.use('/api', apiRouter);

// Sync Database and Launch Server
const startServer = async () => {
  try {
    console.log('Database Sync: Synchronizing Sequelize models with database...');
    // Sync all models to DB. Auto-creates SQLite schema tables.
    await sequelize.sync();
    console.log('Database Sync: Models synced successfully.');

    // Auto-seed the database if it is empty to guarantee a visually complete dashboard immediately
    const leadCount = await Lead.count();
    if (leadCount === 0) {
      console.log('Database Auto-Seed: Empty database detected. Seeding mock leads for first-run onboarding...');
      const mockReq = {};
      const mockRes = {
        status: () => ({
          json: (data) => console.log(`Database Auto-Seed: ${data.message}`)
        })
      };
      await seedDemoLeads(mockReq, mockRes);
    }

    app.listen(PORT, () => {
      console.log(`================================================================`);
      console.log(`  🚀 CLIENT CRM EXPRESS SERVER STARTED SUCCESSFULLY             `);
      console.log(`  🌐 Environment:       ${process.env.NODE_ENV || 'development'} `);
      console.log(`  💾 DB Dialect:         ${process.env.DB_DIALECT || 'sqlite'}   `);
      console.log(`  ⚡ API Port:           ${PORT}                                 `);
      console.log(`  📬 Contact Webhook:    http://localhost:${PORT}/api/leads/webhook`);
      console.log(`================================================================`);
    });
  } catch (error) {
    console.error('Fatal Server Error: Failed to synchronize or launch server:', error);
    process.exit(1);
  }
};

startServer();
