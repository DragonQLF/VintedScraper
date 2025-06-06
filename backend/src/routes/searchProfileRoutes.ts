import { Router } from 'express';
import { 
  createSearchProfile, 
  getSearchProfiles, 
  updateSearchProfile, 
  deleteSearchProfile 
} from '../controllers/searchProfileController';
import { protect } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

// Create a new search profile
router.post('/', createSearchProfile);

// Get all search profiles for the authenticated user
router.get('/', getSearchProfiles);

// Update a search profile
router.put('/:id', updateSearchProfile);

// Delete a search profile
router.delete('/:id', deleteSearchProfile);

export default router; 