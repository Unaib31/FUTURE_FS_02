import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Name is required' }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: { msg: 'Invalid email address' },
      notEmpty: { msg: 'Email is required' }
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'),
    defaultValue: 'New',
    allowNull: false
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  source: {
    type: DataTypes.STRING,
    defaultValue: 'Website Contact Form',
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true // Auto creates createdAt and updatedAt (essential for lead timelines!)
});

export default Lead;
