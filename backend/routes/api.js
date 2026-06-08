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
import { login, getMe, register, getAllUsers } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Authentication Endpoints (Unprotected / Partially Protected)
router.post('/auth/login', login);
router.get('/auth/me', protect, getMe);
router.post('/auth/register', protect, register); // Admin-only: must be logged in to create new users
router.get('/auth/users', protect, getAllUsers);   // Admin-only: fetch active user accounts

// Lead CRUD Endpoints (Protected)
router.get('/leads', protect, getLeads);
router.get('/leads/:id', protect, getLeadById);
router.post('/leads', protect, createLead);
router.put('/leads/:id', protect, updateLead);
router.delete('/leads/:id', protect, deleteLead);

// Lead Notes Endpoints (Protected)
router.post('/leads/:id/notes', protect, addNote);
router.delete('/notes/:id', protect, deleteNote);

// Dashboard Analytics Endpoint (Protected)
router.get('/dashboard/stats', protect, getDashboardStats);

// Database Seeder Endpoint (Protected)
router.post('/leads/seed', protect, seedDemoLeads);

// Webhook Contact Form Integration Endpoint (Alias for Lead Creation - Unprotected)
// This endpoint is perfect for public iframe embeds or cross-origin submissions
router.post('/leads/webhook', createLead);

export default router;

