import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_crm_jwt_token_key_987654321';

export const protect = async (req, res, next) => {
  let token;

  // Check if header contains authorization bearer
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Split "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Decode and verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Find user and attach to req.user (excluding password)
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return res.status(401).json({ message: 'Not authorized: User no longer exists' });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Not authorized: Invalid or expired token' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized: No token provided in headers' });
  }
};
