import { Router } from 'express';
import authRoutes from './auth.routes.js';
import farmRoutes from './farm.routes.js';
import soilRoutes from './soil.routes.js';
import cropRoutes from './crop.routes.js';
import aiRoutes from './ai.routes.js';
import advisoryRoutes from './advisory.routes.js';
import weatherRoutes from './weather.routes.js';
import adminRoutes from './admin.routes.js';
import expertRoutes from './expert.routes.js';

const router = Router();

// Health Check Endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'AgriSmart AI Advisory Platform',
    version: '1.0.0'
  });
});

// Mounted Routes
router.use('/auth', authRoutes);
router.use('/farms', farmRoutes);
router.use('/soil-tests', soilRoutes);
router.use('/crops', cropRoutes);
router.use('/ai', aiRoutes);
router.use('/advisories', advisoryRoutes);
router.use('/weather', weatherRoutes);
router.use('/admin', adminRoutes);
router.use('/expert', expertRoutes);

export default router;
