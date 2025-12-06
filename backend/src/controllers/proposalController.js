const { Proposal, RFP, Vendor } = require("../models");
const aiService = require("../services/aiService");

class ProposalController {
  /**
   * Get all proposals for an RFP
   */
  async getProposalsByRFP(req, res) {
    try {
      const { rfpId } = req.params;

      const proposals = await Proposal.findAll({
        where: { rfp_id: rfpId },
        include: [
          {
            association: "vendor",
            attributes: ["id", "name", "email", "contact_person", "phone"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      return res.json({
        success: true,
        data: proposals,
      });
    } catch (error) {
      console.error("Error fetching proposals:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch proposals",
        error: error.message,
      });
    }
  }

  /**
   * Get a single proposal by ID
   */
  async getProposalById(req, res) {
    try {
      const { id } = req.params;

      const proposal = await Proposal.findByPk(id, {
        include: [
          {
            association: "vendor",
            attributes: ["id", "name", "email", "contact_person", "phone"],
          },
          {
            association: "rfp",
            attributes: ["id", "title", "total_budget", "delivery_deadline"],
          },
        ],
      });

      if (!proposal) {
        return res.status(404).json({
          success: false,
          message: "Proposal not found",
        });
      }

      return res.json({
        success: true,
        data: proposal,
      });
    } catch (error) {
      console.error("Error fetching proposal:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch proposal",
        error: error.message,
      });
    }
  }

  /**
   * Delete a proposal
   */
  async deleteProposal(req, res) {
    try {
      const { id } = req.params;

      const proposal = await Proposal.findByPk(id);
      if (!proposal) {
        return res.status(404).json({
          success: false,
          message: "Proposal not found",
        });
      }

      await proposal.destroy();

      return res.json({
        success: true,
        message: "Proposal deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting proposal:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete proposal",
        error: error.message,
      });
    }
  }

  /**
   * Compare proposals for an RFP using AI
   */
  async compareProposals(req, res) {
    try {
      const { rfpId } = req.params;

      // Fetch RFP
      const rfp = await RFP.findByPk(rfpId);
      if (!rfp) {
        return res.status(404).json({
          success: false,
          message: "RFP not found",
        });
      }

      // Fetch all proposals for this RFP
      const proposals = await Proposal.findAll({
        where: { rfp_id: rfpId },
        include: ["vendor"],
      });

      if (proposals.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No proposals found for this RFP",
        });
      }

      if (proposals.length === 1) {
        return res.status(400).json({
          success: false,
          message: "Need at least 2 proposals to compare",
        });
      }

      // Use AI to compare proposals
      console.log(`🤖 Comparing ${proposals.length} proposals with AI...`);
      const comparisonResult = await aiService.compareAndEvaluateProposals(
        rfp.toJSON(),
        proposals.map((p) => p.toJSON())
      );

      if (!comparisonResult.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to compare proposals",
          error: comparisonResult.error,
        });
      }

      // Update proposals with AI scores
      for (const evaluation of comparisonResult.data.evaluations) {
        const proposal = proposals.find(
          (p) => p.vendor_id === evaluation.vendor_id
        );
        if (proposal) {
          await proposal.update({
            ai_score: evaluation.score,
            ai_evaluation: JSON.stringify({
              price_score: evaluation.price_score,
              delivery_score: evaluation.delivery_score,
              completeness_score: evaluation.completeness_score,
              pros: evaluation.pros,
              cons: evaluation.cons,
              summary: evaluation.summary,
            }),
            status: "evaluated",
          });
        }
      }

      console.log("✅ Proposals compared and scored successfully");

      return res.json({
        success: true,
        data: comparisonResult.data,
      });
    } catch (error) {
      console.error("Error comparing proposals:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to compare proposals",
        error: error.message,
      });
    }
  }

  /**
   * Get all proposals (for admin view)
   */
  async getAllProposals(req, res) {
    try {
      const proposals = await Proposal.findAll({
        include: ["vendor", "rfp"],
        order: [["created_at", "DESC"]],
      });

      return res.json({
        success: true,
        data: proposals,
      });
    } catch (error) {
      console.error("Error fetching proposals:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch proposals",
        error: error.message,
      });
    }
  }
}

module.exports = new ProposalController();
