import express from 'express';
import { getAllJobs } from '../controllers/jobController.js';

const router = express.Router();

router.get('/', getAllJobs);

export default router;