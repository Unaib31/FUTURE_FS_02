import express from 'express';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  addNote,
  deleteNote,
  seedDemoLeads
} from '../controllers/leadController.js';
import { getDashboardStats } from '../controllers/dashboardController.js';

const router = express.Router();

// Lead CRUD Endpoints
router.get('/leads', getLeads);
router.get('/leads/:id', getLeadById);
router.post('/leads', createLead);
router.put('/leads/:id', updateLead);
router.delete('/leads/:id', deleteLead);

// Lead Notes Endpoints
router.post('/leads/:id/notes', addNote);
router.delete('/notes/:id', deleteNote);

// Dashboard Analytics Endpoint
router.get('/dashboard/stats', getDashboardStats);

// Database Seeder Endpoint
router.post('/leads/seed', seedDemoLeads);

// Webhook Contact Form Integration Endpoint (Alias for Lead Creation)
// This endpoint is perfect for public iframe embeds or cross-origin submissions
router.post('/leads/webhook', createLead);

export default router;
