const RFP = require('./rfp');
const Vendor = require('./vendor');
const Proposal = require('./proposal');
const RFPVendor = require('./rfpVendor');

// Define relationships

// RFP <-> Vendor (Many-to-Many through RFPVendor)
RFP.belongsToMany(Vendor, {
  through: RFPVendor,
  foreignKey: 'rfp_id',
  otherKey: 'vendor_id',
  as: 'vendors',
});

Vendor.belongsToMany(RFP, {
  through: RFPVendor,
  foreignKey: 'vendor_id',
  otherKey: 'rfp_id',
  as: 'rfps',
});

// RFP -> Proposals (One-to-Many)
RFP.hasMany(Proposal, {
  foreignKey: 'rfp_id',
  as: 'proposals',
});

Proposal.belongsTo(RFP, {
  foreignKey: 'rfp_id',
  as: 'rfp',
});

// Vendor -> Proposals (One-to-Many)
Vendor.hasMany(Proposal, {
  foreignKey: 'vendor_id',
  as: 'proposals',
});

Proposal.belongsTo(Vendor, {
  foreignKey: 'vendor_id',
  as: 'vendor',
});

module.exports = {
  RFP,
  Vendor,
  Proposal,
  RFPVendor,
};