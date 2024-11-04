import express from 'express';

import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/posts', authenticateToken, (req, res) => {
    res.json({ message: 'You are logged in! welcome!', userId: req.user.userId });
});
  
export default router;
  