import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, accessTokenSecret, (err, user) => {

    if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token has expired' });
        }
        return res.status(403).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  });
};
