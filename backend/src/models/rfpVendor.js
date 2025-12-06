const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RFPVendor = sequelize.define('RFPVendor', {
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
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  email_status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed'),
    defaultValue: 'pending',
  },
}, {
  tableName: 'rfp_vendors',
  timestamps: true,
  underscored: true,
});

module.exports = RFPVendor;