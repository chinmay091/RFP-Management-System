const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Proposal = sequelize.define('Proposal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  rfp_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'rfps',
      key: 'id',
    },
  },
  vendor_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'vendors',
      key: 'id',
    },
  },
  raw_email_content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  parsed_data: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'AI-extracted pricing, terms, items',
  },
  total_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  delivery_time: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Delivery time in days',
  },
  ai_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'AI-generated score 0-100',
  },
  ai_evaluation: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('received', 'parsed', 'evaluated'),
    defaultValue: 'received',
  },
  received_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'proposals',
  timestamps: true,
  underscored: true,
});

module.exports = Proposal;