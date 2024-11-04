import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import dotenv from 'dotenv';
dotenv.config();

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

export const registerUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
      [username, hashedPassword]
    );
    res.status(201).json({ userId: result.rows[0].id, message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'User registration failed' });
  }
};

export const loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = userResult.rows[0];

    if (user && (await bcrypt.compare(password, user.password))) {
      const accessToken = jwt.sign({ userId: user.id }, accessTokenSecret, { expiresIn: '59s' });
      const refreshToken = jwt.sign({ userId: user.id }, refreshTokenSecret, { expiresIn: '7d' }); 

      await pool.query('INSERT INTO tokens (user_id, refresh_token) VALUES ($1, $2)', [user.id, refreshToken]);
      res.json({ accessToken, refreshToken });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.status(403).json({ error: 'Refresh token required' });

  try {
    const result = await pool.query('SELECT * FROM tokens WHERE refresh_token = $1', [refreshToken]);
    if (result.rowCount === 0) return res.status(403).json({ error: 'Invalid refresh token' });

    jwt.verify(refreshToken, refreshTokenSecret, async (err, user) => {
      if (err) return res.status(403).json({ error: 'Invalid refresh token' });

      const newAccessToken = jwt.sign({ userId: user.userId }, accessTokenSecret, { expiresIn: '59s' });
      const newRefreshToken = jwt.sign({ userId: user.userId }, refreshTokenSecret, { expiresIn: '7d' });

      await pool.query('UPDATE tokens SET refresh_token = $1 WHERE refresh_token = $2', [newRefreshToken, refreshToken]);

      res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    });
  } catch (error) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

export const logoutUser = async (req, res) => {
  const { refreshToken } = req.body;
  try {
    await pool.query('DELETE FROM tokens WHERE refresh_token = $1', [refreshToken]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
};