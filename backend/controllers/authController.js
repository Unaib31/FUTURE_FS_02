import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_crm_jwt_token_key_987654321';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token helper
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

// Handle administrator login
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Locate the user record
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Compare encrypted passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate response token
    const token = generateToken(user.id);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'An error occurred during login', error: error.message });
  }
};

// Get current logged in user context
export const getMe = async (req, res) => {
  try {
    // req.user is populated by the authMiddleware
    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      user: {
        id: req.user.id,
        username: req.user.username
      }
    });
  } catch (error) {
    console.error('Verify user error:', error);
    return res.status(500).json({ message: 'Error retrieving user session', error: error.message });
  }
};

// Seed default administrator if DB is empty
export const seedAdminUser = async () => {
  try {
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('Database Auto-Seed: No user accounts detected. Seeding default administrator account...');
      await User.create({
        username: 'admin',
        password: 'admin123' // Hashed automatically by the User beforeSave hook!
      });
      console.log('Database Auto-Seed: Default administrator account created successfully.');
      console.log('  Credentials: username="admin", password="admin123"');
    }
  } catch (error) {
    console.error('Failed to seed default admin user:', error);
  }
};
