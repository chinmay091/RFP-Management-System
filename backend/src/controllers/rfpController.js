const { RFP } = require('../models');
const aiService = require('../services/aiService');

class RFPController {
  /**
   * Create RFP from natural language
   */
  async createRFP(req, res) {
    try {
      const { naturalLanguageInput } = req.body;

      if (!naturalLanguageInput || naturalLanguageInput.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Natural language input is required',
        });
      }

      // Use AI to parse the input
      const aiResult = await aiService.parseRFPFromNaturalLanguage(naturalLanguageInput);

      if (!aiResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to parse RFP',
          error: aiResult.error,
        });
      }

      const parsedData = aiResult.data;

      // Calculate delivery deadline
      const deliveryDeadline = parsedData.delivery_days
        ? new Date(Date.now() + parsedData.delivery_days * 24 * 60 * 60 * 1000)
        : null;

      // Create RFP in database
      const rfp = await RFP.create({
        title: parsedData.title,
        description: parsedData.description || naturalLanguageInput,
        structured_requirements: {
          items: parsedData.items || [],
          original_input: naturalLanguageInput,
        },
        total_budget: parsedData.total_budget,
        delivery_deadline: deliveryDeadline,
        payment_terms: parsedData.payment_terms,
        warranty_requirements: parsedData.warranty_requirements,
        status: 'draft',
      });

      return res.status(201).json({
        success: true,
        message: 'RFP created successfully',
        data: rfp,
      });
    } catch (error) {
      console.error('Error creating RFP:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create RFP',
        error: error.message,
      });
    }
  }

  /**
   * Get all RFPs
   */
  async getAllRFPs(req, res) {
    try {
      const rfps = await RFP.findAll({
        order: [['created_at', 'DESC']],
        include: [
          {
            association: 'vendors',
            through: { attributes: ['sent_at', 'email_status'] },
          },
        ],
      });

      return res.json({
        success: true,
        data: rfps,
      });
    } catch (error) {
      console.error('Error fetching RFPs:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch RFPs',
        error: error.message,
      });
    }
  }

  /**
   * Get single RFP by ID
   */
  async getRFPById(req, res) {
    try {
      const { id } = req.params;

      const rfp = await RFP.findByPk(id, {
        include: [
          {
            association: 'vendors',
            through: { attributes: ['sent_at', 'email_status'] },
          },
          {
            association: 'proposals',
            include: ['vendor'],
          },
        ],
      });

      if (!rfp) {
        return res.status(404).json({
          success: false,
          message: 'RFP not found',
        });
      }

      return res.json({
        success: true,
        data: rfp,
      });
    } catch (error) {
      console.error('Error fetching RFP:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch RFP',
        error: error.message,
      });
    }
  }

  /**
   * Update RFP status
   */
  async updateRFPStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const rfp = await RFP.findByPk(id);

      if (!rfp) {
        return res.status(404).json({
          success: false,
          message: 'RFP not found',
        });
      }

      rfp.status = status;
      await rfp.save();

      return res.json({
        success: true,
        message: 'RFP status updated',
        data: rfp,
      });
    } catch (error) {
      console.error('Error updating RFP:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update RFP',
        error: error.message,
      });
    }
  }

  /**
   * Delete RFP
   */
  async deleteRFP(req, res) {
    try {
      const { id } = req.params;

      const rfp = await RFP.findByPk(id);

      if (!rfp) {
        return res.status(404).json({
          success: false,
          message: 'RFP not found',
        });
      }

      await rfp.destroy();

      return res.json({
        success: true,
        message: 'RFP deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting RFP:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete RFP',
        error: error.message,
      });
    }
  }
}

module.exports = new RFPController();