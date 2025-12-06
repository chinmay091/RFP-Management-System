const { Vendor } = require('../models');

class VendorController {
  /**
   * Create a new vendor
   */
  async createVendor(req, res) {
    try {
      const { name, email, contact_person, phone, category } = req.body;

      // Validation
      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: 'Name and email are required',
        });
      }

      // Check if vendor already exists
      const existingVendor = await Vendor.findOne({ where: { email } });
      if (existingVendor) {
        return res.status(400).json({
          success: false,
          message: 'Vendor with this email already exists',
        });
      }

      const vendor = await Vendor.create({
        name,
        email,
        contact_person,
        phone,
        category,
      });

      return res.status(201).json({
        success: true,
        message: 'Vendor created successfully',
        data: vendor,
      });
    } catch (error) {
      console.error('Error creating vendor:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create vendor',
        error: error.message,
      });
    }
  }

  /**
   * Get all vendors
   */
  async getAllVendors(req, res) {
    try {
      const vendors = await Vendor.findAll({
        order: [['name', 'ASC']],
      });

      return res.json({
        success: true,
        data: vendors,
      });
    } catch (error) {
      console.error('Error fetching vendors:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch vendors',
        error: error.message,
      });
    }
  }

  /**
   * Get vendor by ID
   */
  async getVendorById(req, res) {
    try {
      const { id } = req.params;

      const vendor = await Vendor.findByPk(id);

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found',
        });
      }

      return res.json({
        success: true,
        data: vendor,
      });
    } catch (error) {
      console.error('Error fetching vendor:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch vendor',
        error: error.message,
      });
    }
  }

  /**
   * Update vendor
   */
  async updateVendor(req, res) {
    try {
      const { id } = req.params;
      const { name, email, contact_person, phone, category } = req.body;

      const vendor = await Vendor.findByPk(id);

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found',
        });
      }

      // Check email uniqueness if changing
      if (email && email !== vendor.email) {
        const existingVendor = await Vendor.findOne({ where: { email } });
        if (existingVendor) {
          return res.status(400).json({
            success: false,
            message: 'Email already in use by another vendor',
          });
        }
      }

      await vendor.update({
        name: name || vendor.name,
        email: email || vendor.email,
        contact_person,
        phone,
        category,
      });

      return res.json({
        success: true,
        message: 'Vendor updated successfully',
        data: vendor,
      });
    } catch (error) {
      console.error('Error updating vendor:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update vendor',
        error: error.message,
      });
    }
  }

  /**
   * Delete vendor
   */
  async deleteVendor(req, res) {
    try {
      const { id } = req.params;

      const vendor = await Vendor.findByPk(id);

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found',
        });
      }

      await vendor.destroy();

      return res.json({
        success: true,
        message: 'Vendor deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting vendor:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete vendor',
        error: error.message,
      });
    }
  }
}

module.exports = new VendorController();