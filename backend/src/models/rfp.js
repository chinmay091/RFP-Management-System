const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RFP = sequelize.define('RFP', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  structured_requirements: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'AI-parsed requirements: items, specs, etc.',
  },
  total_budget: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  delivery_deadline: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  payment_terms: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  warranty_requirements: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'closed'),
    defaultValue: 'draft',
  },
}, {
  tableName: 'rfps',
  timestamps: true,
  underscored: true,
});

module.exports = RFP;