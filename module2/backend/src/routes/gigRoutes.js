import { Router } from 'express';
import auth, { allowRole } from '../middleware/auth.js';
import {
  createGig,
  listGigs,
  getGig,
  applyToGig,
  myApplications,
  clientApplications,
  updateApplication,
  myGigs,
  updateGigStatus
} from '../controllers/gigController.js';

const router = Router();

// Public gig listing
router.get('/', listGigs);

// Client gig management
router.get('/client/mine', auth, allowRole('client'), myGigs);
router.post('/', auth, allowRole('client'), createGig);
router.patch('/:id/status', auth, allowRole('client'), updateGigStatus);

// Student and client applications
router.get('/student/applications/mine', auth, allowRole('student'), myApplications);
router.get('/client/applications/inbox', auth, allowRole('client'), clientApplications);
router.patch('/applications/:applicationId', auth, allowRole('client'), updateApplication);
router.post('/:id/applications', auth, allowRole('student'), applyToGig);

// Single gig details (placed after static GET routes for clarity)
router.get('/:id', getGig);

export default router;

