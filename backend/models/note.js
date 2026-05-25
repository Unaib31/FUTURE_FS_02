import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Note = sequelize.define('Note', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Note content cannot be empty' }
    }
  },
  author: {
    type: DataTypes.STRING,
    defaultValue: 'CRM Administrator',
    allowNull: false
  }
}, {
  timestamps: true // Auto creates createdAt and updatedAt
});

export default Note;
