import sequelize from '../config/db.js';
import Lead from './lead.js';
import Note from './note.js';
import User from './user.js';

// Define Associations
// A Lead can have many notes. Deleting a lead deletes its notes (CASCADE).
Lead.hasMany(Note, {
  foreignKey: {
    allowNull: false
  },
  onDelete: 'CASCADE',
  hooks: true
});
Note.belongsTo(Lead, {
  foreignKey: {
    allowNull: false
  }
});

export {
  sequelize,
  Lead,
  Note,
  User
};

