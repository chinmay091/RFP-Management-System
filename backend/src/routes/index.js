const express = require('express');
const router = express.Router();

const rfpController = require('../controllers/rfpController');
const vendorController = require('../controllers/vendorController');
const emailController = require('../controllers/emailController');
const proposalController = require('../controllers/proposalController');

// Root API info
router.get('/', (req, res) => {
  res.json({
    message: 'RFP Management API',
    version: '1.0.0',
    endpoints: {
      rfps: '/api/rfps',
      vendors: '/api/vendors',
      proposals: '/api/proposals',
      email: '/api/email',
    },
  });
});

// ========== RFP Routes ==========
router.post('/rfps', rfpController.createRFP);
router.get('/rfps', rfpController.getAllRFPs);
router.get('/rfps/:id', rfpController.getRFPById);
router.patch('/rfps/:id/status', rfpController.updateRFPStatus);
router.delete('/rfps/:id', rfpController.deleteRFP);

// ========== Vendor Routes ==========
router.post('/vendors', vendorController.createVendor);
router.get('/vendors', vendorController.getAllVendors);
router.get('/vendors/:id', vendorController.getVendorById);
router.put('/vendors/:id', vendorController.updateVendor);
router.delete('/vendors/:id', vendorController.deleteVendor);

// ========== Proposal Routes ==========
router.get('/proposals', proposalController.getAllProposals);
router.get('/proposals/rfp/:rfpId', proposalController.getProposalsByRFP);
router.get('/proposals/:id', proposalController.getProposalById);
router.get('/proposals/rfp/:rfpId/compare', proposalController.compareProposals);
router.delete('/proposals/:id', proposalController.deleteProposal);

// ========== Email Routes ==========
router.post('/email/send-rfp/:rfpId', emailController.sendRFPToVendors);
router.post('/email/fetch-proposals', emailController.fetchVendorEmails);
router.post('/email/test', emailController.testEmailConfig);

module.exports = router;